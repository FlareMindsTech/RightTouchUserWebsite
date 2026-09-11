# RightTouch Quotation Payment Engine
## Hardened Payment Lifecycle: Order Creation vs Signature Verification

> **Module**: Custom Product Quotations Payment Engine  
> **Source Files**: [`src/pages/QuotationsPage.js`](file:///home/vicky/flareminds/RightTouch/RightTouchUserWebsite/src/pages/QuotationsPage.js), [`src/pages/CheckoutPage.js`](file:///home/vicky/flareminds/RightTouch/RightTouchUserWebsite/src/pages/CheckoutPage.js), [`src/services/paymentService.js`](file:///home/vicky/flareminds/RightTouch/RightTouchUserWebsite/src/services/paymentService.js), [`src/utils/razorpay.js`](file:///home/vicky/flareminds/RightTouch/RightTouchUserWebsite/src/utils/razorpay.js)

---

## 1. Validated Quotation Payment Lifecycle

> [!IMPORTANT]
> **Core Architectural Rule**: A quotation/booking is **NEVER marked as paid merely because the `POST /api/user/payment/order` API returned `success: true` or `status: "success"`**. Only cryptographic HMAC signature verification (or an authoritative webhook) transitions the payment and booking status to `paid`.

```
[Customer Clicks "Accept & Pay Online" in QuotationsPage.js]
                        │
                        ▼
    1. Lock & Accept Quotation (POST /api/user/quotations/:id/accept)
       Converts quote into ProductBooking & locks financial snapshot
       Status = 'accepted', PaymentStatus = 'pending'
                        │
                        ▼
    2. Dynamic Razorpay SDK Injection (loadRazorpayScript)
       Injects https://checkout.razorpay.com/v1/checkout.js into DOM
                        │
                        ▼
    3. Generate Server Payment Order (POST /api/user/payment/order)
       Reads snapshot, creates Razorpay Order, returns orderId & amount in paise
       PaymentStatus REMAINS 'pending'
                        │
       ┌────────────────┴────────────────┐
       │                                 │
[Zero Amount / Free]            [Active Payable Amount > 0]
       │                                 │
       ▼                                 ▼
Fast-Path Confirmation          4. Launch Razorpay Checkout Modal
(No Gateway Required)              - Custom Theme: #2DB84B
                                   - Prefill Name, Email, Sanitized Phone
                                                 │
                                                 ▼
                                5. Customer Completes Payment (UPI / Card)
                                                 │
                                                 ▼
                                6. Fast-Path Signature Verification
                                   POST /api/user/payment/verify
                                   (Verifies HMAC-SHA256 signature)
                                                 │
                                                 ▼
                                7. Status Updates to 'paid' ONLY NOW
                                   - Details modal closed
                                   - Quotation table re-fetched via fetchQuotationData()
                                   - "Payment Successful! Order Confirmed." toast displayed
```

---

## 2. Old vs New Payment Flow Comparison

| Flow Aspect | Previous (Flawed) Implementation | Hardened (Current) Implementation |
| :--- | :--- | :--- |
| **Order API Response** | Checked `orderRes.result?.status === 'success'` and prematurely treated it as payment completion | Checks strictly if payable amount is zero: `resData.free === true \|\| rawAmount === 0` |
| **Active Amount > 0** | Could bypass Razorpay checkout if backend returned generic success status | **ALWAYS** opens Razorpay Checkout modal for positive payable amounts |
| **Status Transition** | Vulnerable to false positives where order creation was treated as captured payment | Payment status strictly remains `pending` until `POST /api/user/payment/verify` succeeds |
| **Razorpay Order ID** | Could fail if field naming was inconsistent | Extracts canonical `finalOrderId` (`orderId \|\| razorpayOrderId \|\| id \|\| providerOrderId`) with missing ID check |

---

## 3. Code Implementation Details

### QuotationsPage.js (`src/pages/QuotationsPage.js`)
```javascript
// 3. Create payment order from backend
let orderRes;
try {
  orderRes = await createPaymentOrder({ bookingId: targetBookingId });
} catch (orderErr) {
  if (orderErr?.message?.toLowerCase().includes('already paid')) {
    if (showToast) showToast('This quotation order is already paid!', 'success');
    setShowDetailsModal(false);
    await fetchQuotationData();
    setActionLoading(false);
    return;
  }
  throw orderErr;
}

if (!orderRes?.success || !orderRes.result) {
  throw new Error(orderRes?.message || 'Failed to create payment order from server');
}

console.log("Payment Order Response:", orderRes);
const resData = orderRes.result || orderRes.data || orderRes;
const rawAmount = resData.amount;

// ── Zero-Amount / Free Fast Path ONLY ──
const isFree =
  resData.free === true ||
  (rawAmount != null && Number(rawAmount) === 0);

if (isFree) {
  if (showToast) showToast('Order Confirmed (No payment required)!', 'success');
  setShowDetailsModal(false);
  await fetchQuotationData();
  setActionLoading(false);
  return;
}

const { orderId, razorpayOrderId, id, providerOrderId, keyId, key, currency = 'INR' } = resData;
const finalKey = resolveRazorpayKey({
  envKey: process.env.REACT_APP_RAZORPAY_KEY_ID,
  serverKey: keyId || key || resData?.razorpayKey,
});
const finalOrderId = (orderId || razorpayOrderId || id || providerOrderId || "").trim();
const amountInPaise = Math.round(Number(rawAmount));

if (!finalKey) throw new Error('Razorpay Key ID is missing');
if (!finalOrderId) throw new Error('Razorpay Order ID is missing');
if (!amountInPaise || amountInPaise < 100) throw new Error('Minimum payment amount is ₹1.00');
```

---

## 4. Status Rules & Strict State Transitions

```
Quotation accepted          !=  Paid
Payment order created       !=  Paid
Razorpay checkout opened    !=  Paid
Payment modal closed        ==  Pending
Signature HMAC verified     ==  Paid
Authoritative webhook       ==  Paid
```

| Trigger Event | Resulting Entity States |
| :--- | :--- |
| **Quotation Accepted** | Quotation: `accepted` \| Booking: `pending` \| Payment: `unpaid / pending` |
| **Payment Order Created** | Quotation: `accepted` \| Booking: `pending` \| Payment: `pending` (Razorpay order generated) |
| **Razorpay Modal Open** | Quotation: `accepted` \| Booking: `pending` \| Payment: `pending` (Awaiting customer auth) |
| **Signature Verified** | Quotation: `accepted` \| Booking: `confirmed / paid` \| Payment: `paid` (HMAC valid) |
| **Zero Amount / Free Quote** | Quotation: `accepted` \| Booking: `confirmed / paid` \| Payment: `free / paid` (Bypasses gateway) |
| **Payment Dismissed** | Quotation: `accepted` \| Booking: `pending` \| Payment: `pending` (Modal closed by user) |

---

## 5. Acceptance Test Matrix

| Scenario | Expected Verified Behavior |
| :--- | :--- |
| **Positive Amount (₹1000)** | Click "Pay Online" → `POST /order` → returns `orderId` & `amount: 100000` → Checkout opens → Customer pays → `POST /verify` → signature verified → Status becomes `paid` → Success Toast shown |
| **Zero Amount / Free (₹0)** | Click "Pay Online" → `POST /order` → returns `amount: 0` or `free: true` → No Checkout modal → Order confirmed directly without gateway error → Success Toast shown |
| **Order API Returns `success: true`** | `POST /order` returns `{ success: true, result: { orderId: '...', amount: 100000 } }` → Checkout modal **MUST** open → **DOES NOT** show "Payment Successful" prematurely |
| **User Closes Modal** | User opens Razorpay modal and clicks "X" → `ondismiss` triggers → `actionLoading` resets to `false` → Status remains `pending` |
| **Invalid Signature** | `POST /verify` returns `success: false` → Shows "Payment verification failed" → Status remains `pending` → No paid state update |
| **Already Paid Re-Click** | User clicks "Pay Online" on already paid quote → Server throws `already paid` → Frontend catches error and shows "This quotation order is already paid!" |
