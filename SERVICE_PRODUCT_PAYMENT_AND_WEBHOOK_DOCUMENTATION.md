# RightTouch Payment & Webhook Architecture
## Comprehensive Technical Guide: Product Payments vs Service Payments & Authoritative Webhook Backstop

> **Scope**: End-to-end payment lifecycle for Doorstep Services, Products, Custom Quotations, and Razorpay Webhook Integration.  
> **Source Files**: [`src/pages/QuotationsPage.js`](file:///home/vicky/flareminds/RightTouch/RightTouchUserWebsite/src/pages/QuotationsPage.js), [`src/pages/CheckoutPage.js`](file:///home/vicky/flareminds/RightTouch/RightTouchUserWebsite/src/pages/CheckoutPage.js), [`src/pages/PaymentsPage.js`](file:///home/vicky/flareminds/RightTouch/RightTouchUserWebsite/src/pages/PaymentsPage.js), [`src/services/paymentService.js`](file:///home/vicky/flareminds/RightTouch/RightTouchUserWebsite/src/services/paymentService.js), [`src/utils/razorpay.js`](file:///home/vicky/flareminds/RightTouch/RightTouchUserWebsite/src/utils/razorpay.js)

---

## 1. Comparative Analysis: Service Payments vs Product Payments

| Dimension | Service Payments (Doorstep Services) | Product Payments (Cart & Custom Quotations) |
| :--- | :--- | :--- |
| **Payment Timing** | **Post-Service Completion** (Customer pays only after technician completes the job). | **Pre-Fulfillment Upfront** (Customer pays during cart checkout or quotation acceptance). |
| **Payment Trigger Point** | `PaymentsPage.js` or `BookingsPage.js` after `status === 'completed'`. | `CheckoutPage.js` (Cart checkout) or `QuotationsPage.js` (Accept quote). |
| **Financial Split Engine** | Includes Base Amount + GST (5%) + Tip + **Technician Wallet Share** + **Admin Commission**. | Base Amount + GST (5%) + Shipping/Installation. **100% Platform Revenue** (No technician payout). |
| **Ledger & Settlement** | Automatically credits Technician Wallet balance upon payment capture. | Settles company revenue ledger and updates product inventory records. |
| **Cash Workflow** | Customer declares cash (`declareCashPayment`) → Technician confirms receipt. | Cash on Delivery (COD) selected at checkout → Settled upon physical delivery. |
| **Cancellation & Refunds** | Free cancellation prior to technician dispatch. Post-completion refund based on policy rules. | Cancelable prior to `out_for_delivery` → Triggers automated Razorpay refund engine. |

---

## 2. How Service Payments Work (Pay-After-Completion)

```
[Technician Completes Service at Customer Doorstep]
                        │
                        ▼
  Technician App marks ServiceBooking status = 'completed'
  Server freezes immutable financialSnapshot (Base + GST + Tech Share)
                        │
                        ▼
  Customer opens PaymentsPage.js / BookingDetailPage.js
  "Pay Now" button unlocks
                        │
                        ▼
  POST /api/user/payment/order (or /api/user/payments/:id/order)
  - Validates status === 'completed'
  - Creates Razorpay order for snapshot total in paise
  - Returns orderId & keyId (Payment status remains 'pending')
                        │
                        ▼
  Customer authorizes payment on Razorpay Checkout Modal
                        │
                        ▼
  POST /api/user/payment/verify (Fast-Path HMAC-SHA256 Verification)
  - Cryptographically verifies signature
  - Marks Payment status = 'success'
  - Marks ServiceBooking paymentStatus = 'paid'
  - AUTOMATICALLY CREDITS TECHNICIAN WALLET with technicianAmountPaise
  - Generates compliance Tax Invoice (InvoiceModal.js)
```

---

## 3. How Product & Custom Quotation Payments Work (Upfront)

```
[Customer Checks Out Cart OR Accepts Custom Quotation]
                        │
                        ▼
  Cart Checkout: POST /api/user/checkout -> Creates ProductBooking
  Quotation: POST /api/user/quotations/:id/accept -> Creates ProductBooking
                        │
                        ▼
  POST /api/user/payment/order
  - Validates ProductBooking snapshot
  - Generates Razorpay Order
  - Returns orderId, amount in paise, currency
                        │
                        ▼
  Customer completes payment on Razorpay Checkout Modal
                        │
                        ▼
  POST /api/user/payment/verify
  - Verifies HMAC-SHA256 signature
  - Marks ProductBooking paymentStatus = 'paid'
  - Marks Quotation status = 'accepted' & paymentStatus = 'paid'
  - Allocates inventory & notifies warehouse/admin for fulfillment
```

---

## 4. How the Razorpay Webhook Works (Authoritative Backstop)

While the frontend fast-path (`POST /api/user/payment/verify`) provides instant UI confirmation, the **Razorpay Webhook** is the authoritative, asynchronous, server-to-server backstop that guarantees financial settlement even if the customer's browser crashes, loses internet, or closes before the redirect.

```
[Customer Completes Payment on Razorpay Servers]
                        │
       ┌────────────────┴────────────────┐
       │                                 │
 [Fast-Path (Browser)]          [Authoritative Webhook (Server-to-Server)]
       │                                 │
 Browser sends verify request      Razorpay Server sends HTTP POST
 to POST /api/user/payment/verify  to POST /api/user/payment/webhook/razorpay
       │                           Headers: X-Razorpay-Signature: <HMAC_HEX>
       ▼                                 │
 Both execute the same idempotent core:  ▼
 markPaymentSucceeded(paymentId, providerPaymentId, orderId)
       │
       ▼
 1. Check if already marked 'paid' (Idempotency Guard)
    - If YES: Return 200 OK immediately (Prevents double wallet credit)
    - If NO: Proceed with settlement
 2. Verify HMAC SHA-256 Signature with RAZORPAY_WEBHOOK_SECRET
 3. Transition Payment status -> 'success'
 4. Transition ServiceBooking / ProductBooking -> 'paid'
 5. Record Double-Entry Platform Ledger Entry
 6. For Services: Credit Technician Wallet
 7. Generate Compliance Tax Invoice Receipt (INV-YYYY-XXXX)
```

---

## 5. Webhook Events & Behavior Matrix

| Webhook Event | Trigger Point | Backend Handler Action & State Transition |
| :--- | :--- | :--- |
| **`payment.captured`** | Gateway captures customer funds | Core trigger: validates signature, calls `markPaymentSucceeded()`, updates booking to `paid`, posts platform ledger, and settles technician earnings into their wallet for service bookings. |
| **`order.paid`** | Order amount fully satisfied | Secondary confirmation event for multi-attempt or split-payment captures. |
| **`payment.failed`** | Customer payment fails | Marks `PaymentAttempt` as `failed`, records gateway error description, and leaves booking in `payment_pending` for customer retry. |
| **`refund.processed`** | Refund completed by gateway | Transitions Payment status to `refunded`, writes refund ledger entry, and notifies customer. |

---

## 6. Race Conditions & Idempotency Safeguards

```
Scenario A (Normal Flow):
Browser verify arrives (T = 0s) ──▶ Booking marked 'paid' & Tech Wallet credited
Webhook arrives (T = +3s)       ──▶ Idempotency check detects already 'paid' ──▶ Skips settlement & returns 200 OK

Scenario B (Network Drop / Browser Closed):
Browser drops connection        ──▶ /verify never reaches server
Webhook arrives from Razorpay   ──▶ Validates HMAC signature ──▶ Marks booking 'paid' & credits Tech Wallet
Customer re-opens app           ──▶ Sees booking already confirmed as 'paid'

Scenario C (Duplicate Razorpay Retries):
Razorpay sends webhook 3 times  ──▶ First attempt captures payment; attempts 2 and 3 return 200 OK without duplicate ledger entries
```

---

## 7. Webhook Security & Verification Formula

1. **Header Verification**:
   $$	ext{Expected Signature} = 	ext{HMAC-SHA256}(	ext{Raw Request Body}, 	ext{RAZORPAY\_WEBHOOK\_SECRET})$$
   Compared securely with `X-Razorpay-Signature` using timing-safe comparison (`crypto.timingSafeEqual`).
2. **Replay Protection**:
   Incoming payload timestamps are validated against replay windows.
3. **Double-Entry Ledger Integrity**:
   Financial ledger records immutable debit/credit pairings (Customer Payment $ightarrow$ Platform Escrow $ightarrow$ Technician Wallet / Company Revenue).
