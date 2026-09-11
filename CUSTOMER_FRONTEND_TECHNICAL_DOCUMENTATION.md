# RightTouch Customer Web Application
## Complete End-to-End Frontend Technical & Architectural Documentation

> **Scope**: Entire Frontend Codebase (`src/`) for Customer Web Application.  
> **Source Verification**: All details traced from verified React 19 codebase.

---

## 1. FRONTEND OVERVIEW

| Technology Dimension | Library / Framework | Version & Implementation Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React.js | `v19.2.4` (React 19 with Concurrent Rendering) |
| **Routing Library** | React Router DOM | `v7.13.1` (Configured with `HashRouter` in `index.js`) |
| **Application Type** | Web Application (Responsive SPA) | Mobile-first responsive web client with dedicated desktop/mobile headers |
| **UI & Icons** | Lucide React & React Icons | `lucide-react` (v0.575.0), `react-icons` (v5.5.0: Md, Fi, Fa, Io, Hi) |
| **Styling Approach** | Vanilla CSS & Design Tokens | Centralized CSS variables in `styles/main.css`, modular CSS per page |
| **State Management** | React Core Hooks + Safe Storage | `useState`, `useEffect`, `useCallback`, `useRef`, `safeStorage` wrapper |
| **API Client** | Native Fetch Wrapper | `src/api/api.js` with Bearer token injection & 401 guard |
| **Toast & Alerts** | Goey Toast & Custom RtAlert | `goey-toast` (v0.3.0) + custom styled `RtAlert` banner system |
| **Payment Gateway** | Razorpay Checkout SDK | Dynamic async script loader with key resolution fallback (`razorpay.js`) |
| **Maps & Geolocation**| OpenStreetMap Nominatim | Address search & reverse geocoding with timeout and fallback |
| **Form Handling** | Controlled React Components | Real-time state validation, field masking, regex checks |
| **Build Configuration**| Create React App (`react-scripts`)| `v5.0.1` with `GENERATE_SOURCEMAP=false` |

---

## 2. FRONTEND ARCHITECTURE

```
User Interaction (Click / Input / Scroll)
       ↓
Page / Screen View (e.g. ServicePage, CartPage, CheckoutPage, QuotationsPage)
       ↓
Presentation / Modal Components (e.g. ServiceSheet, AddressModal, AuthDialog, InvoiceModal)
       ↓
Application State & Cache Layer (App.js Global Cache, SafeStorage, Local State)
       ↓
Service Layer (e.g. cartService.js, paymentService.js, quotationService.js)
       ↓
Centralized API Client (src/api/api.js with Token Guard & Error Interceptors)
       ↓
REST API Endpoints (Backend Server)
```

### Layer Mapping

| Architecture Layer | Location in Workspace | Core Responsibilities |
| :--- | :--- | :--- |
| **Presentation Layer** | `src/pages/*` (19 Pages) | Renders user interfaces, captures inputs, manages local page lifecycles |
| **Component Layer** | `src/components/*` (13 Components) | Reusable UI elements: Navbar, BottomNav, AuthDialog, AddressModal, etc. |
| **Global Cache Layer** | `src/App.js` | Production-level caching for categories, services, products, and active cart |
| **Service Layer** | `src/services/*` (18 Services) | Encapsulates REST communication, endpoint bindings, and payload shaping |
| **API Client Layer** | `src/api/api.js` & `endpoints.js` | Configures headers, handles 401 token invalidation, manages base URLs |
| **Utility & Helper Layer** | `src/utils/*` (4 Utility Files) | `browserUtils.js` (Safari dates & nav stack), `razorpay.js`, `format.js`, `share.js` |
| **Storage Layer** | `safeStorage` (`src/utils/browserUtils.js`) | Safari Private Mode safe wrapper for localStorage session management |

---

## 3. COMPLETE FRONTEND FOLDER STRUCTURE

```
src/
├── api/
│   ├── api.js                # Centralized fetch wrapper with auth header injection & 401 handling
│   └── endpoints.js          # REST endpoint URI dictionary
├── assets/
│   ├── logo.png, logo.svg    # Official branding assets
│   └── illustrations/        # Category and status graphics
├── components/
│   ├── AddressModal.js (.css)# OpenStreetMap address picker & geocoding modal
│   ├── AuthDialog.js (.css)  # Customer login dialog with phone OTP flow
│   ├── BottomNav.js          # Mobile 5-tab persistent bottom navigation bar
│   ├── ChatWindow.js         # Customer chat component (present in codebase)
│   ├── ConfirmModal.js (.css)# Generic confirmation dialog
│   ├── Footer.js (.css)      # Comprehensive global footer
│   ├── InvoiceModal.js (.css)# Tax invoice receipt renderer & printable view
│   ├── Navbar.js (.css)      # Desktop header with live search & profile dropdown
│   ├── PaymentManagementModal.js (.css) # Payment retry, order create & cash declaration
│   ├── PayNowButton.js (.css)# Reusable Razorpay payment trigger button
│   ├── QuoteRequestModal.js (.css) # Custom quotation request modal for products
│   ├── RegisterDialog.js     # Customer signup dialog with terms agreement & OTP
│   ├── RtAlert.js (.css)     # Custom toast alert banner container
│   ├── SearchDropdown.js (.css) # Global live search engine for services/products
│   └── ServiceSheet.js       # Sliding bottom sheet for service details & packages
├── hooks/
│   └── Custom React hooks (viewport, media queries, timers)
├── pages/
│   ├── AboutPage.js (.css)   # Company story, mission & quality standards
│   ├── AccountPage.js (.css) # Profile editor, address manager, quick shortcuts
│   ├── BookingDetailPage.js (.css) # Detailed booking timeline, technician info & receipt
│   ├── BookingsPage.js (.css)# Customer service bookings list with tab filters
│   ├── CartPage.js (.css)    # Unified cart with service slot scheduler & quantity controls
│   ├── CheckoutPage.js (.css)# Address selection, slot confirmation & checkout
│   ├── HelpSupportPage.js (.css) # FAQ accordion & contact support channels
│   ├── HomePage.js           # Hero banner, category grid, top services, products carousel
│   ├── LegalPage.js (.css)   # Privacy Policy, Terms of Service, Cancellation Policy
│   ├── PaymentMethodsPage.js (.css) # Supported payment options educational guide
│   ├── PaymentsPage.js (.css)# Customer payment portal (Due, Paid, History, Invoices)
│   ├── ProductDetailPage.js  # Product specs, gallery, discount calculation, quote CTA
│   ├── ProductPage.js        # E-commerce product catalog with category filters
│   ├── ProductServices.js (.css) # Dynamic service/product listing filtered by query param
│   ├── QuotationsPage.js (.css) # Custom quote requests, 24h timer, accept/reject modal
│   ├── RatingsPage.js (.css) # Customer feedback reviews & rating submission
│   ├── ReportPage.js (.css)  # Dispute ticketing & issue reporting with image proof
│   ├── ServicePage.js (.css) # Comprehensive doorstep service catalog with category filter
│   └── SettingsPage.js       # App preferences, dark mode toggle, notification settings
├── services/
│   ├── addressService.js     # Address CRUD + OpenStreetMap Nominatim geocoding
│   ├── authServices.js       # Login, Signup, OTP request/verify, terms acceptance
│   ├── bookingService.js     # Service bookings, slot retrieval, cancellation
│   ├── cancellationService.js# Cancellation reason list and booking cancel wrapper
│   ├── cartService.js        # Add, update quantity, remove, schedule slot, checkout
│   ├── categoryService.js    # Fetch service/product category trees
│   ├── deviceTokenService.js # Push notification token registration
│   ├── notificationService.js# Customer notification list, unread count, mark read
│   ├── paymentService.js     # Order creation, fast-path verification, cash declaration
│   ├── permissionService.js  # User role permission verification
│   ├── productBookingService.js # Physical product orders retrieval and cancellation
│   ├── productService.js     # Product catalog queries
│   ├── quotationService.js   # Quote requests, accept/reject quotes, product bookings
│   ├── ratingService.js      # Customer reviews CRUD
│   ├── reportService.js      # Dispute report creation, categories, history
│   ├── serviceService.js     # Service catalog queries
│   ├── userService.js        # Customer profile GET / PUT / Delete account
│   └── zoneService.js        # Geofence zone resolution and service availability check
├── styles/
│   └── main.css              # Global design tokens, dark mode CSS variables, resets
├── utils/
│   ├── browserUtils.js       # Safari date parser, navigation history stack, safeStorage
│   ├── format.js             # Currency (INR ₹) and date formatting helpers
│   ├── razorpay.js           # Razorpay SDK loader and key mismatch resolver
│   └── share.js              # Native navigator.share wrapper with clipboard fallback
├── App.js                    # Core application router, global cache & optimistic cart
├── index.js                  # App root with HashRouter & React.StrictMode
└── package.json              # Project dependencies & build configuration
```

---

## 4. FRD — FRONTEND FUNCTIONAL REQUIREMENTS DOCUMENT

### 4.1 Customer Authentication & Registration Module
* **Purpose**: Allow customers to sign up with mobile/email or log in using mobile OTP authentication.
* **User/Role**: Customer (Guest / Authenticated Customer).
* **Entry Points**: Header "Sign In" button, Cart checkout guard, Booking actions, Quotation acceptance.
* **Screens/Components**: `AuthDialog.js`, `RegisterDialog.js`, `Navbar.js`.
* **Validation**:
  * Indian Mobile Number: 10 digits starting with 6-9 (`/^[6-9]\d{9}$/`).
  * OTP: Exactly 6 numeric digits.
  * Name: Minimum 2 characters.
  * Email: RFC-compliant email string.
  * Terms Acceptance: Checkbox mandatory for registration.
* **Success Behavior**: Stores JWT token in `safeStorage.setItem('token', token)` and user profile in `safeStorage.setItem('currentUser', JSON.stringify(user))`. Dispatches `userProfileUpdated` event to notify all components.
* **Session Guard**: Automatically purges non-customer tokens (Admin/Technician) if found in localStorage on startup.

### 4.2 Doorstep Services Catalog & Cart Module
* **Purpose**: Browse doorstep services, view pricing details, configure packages, schedule service slots, and place orders.
* **Screens/Components**: `HomePage.js`, `ServicePage.js`, `ProductServices.js`, `ServiceSheet.js`, `CartPage.js`.
* **Optimistic Cart Mechanics**:
  * When user clicks "Add to Cart", the item is immediately injected into `cartItems` state with a temporary ID (`temp-${Date.now()}`).
  * The backend API `POST /api/user/cart/add` is executed concurrently.
  * On success, the temporary item is replaced by the server record with full pricing precision.
  * On failure, the local state is rolled back and an error toast is triggered.
* **Slot Scheduling**: Customer selects date and 2-hour slot (`10:00 AM - 12:00 PM`, `02:00 PM - 04:00 PM`, etc.) directly inside `CartPage.js`.

### 4.3 Product E-Commerce & Custom Quotation Module
* **Purpose**: Purchase standard physical products or submit custom repair quotation requests for bespoke estimation.
* **Screens/Components**: `ProductPage.js`, `ProductDetailPage.js`, `QuoteRequestModal.js`, `QuotationsPage.js`.
* **Quotation Lifecycle**:
  1. Customer submits quote request via `QuoteRequestModal.js` (`POST /api/user/product-quote-requests`).
  2. Admin reviews request and issues a formal quotation.
  3. Quotation appears in `QuotationsPage.js` with active 24-hour countdown timer.
  4. Customer views price breakdown, admin notes, and terms & conditions.
  5. Customer accepts quote (`POST /api/user/quotations/:id/accept`) and pays immediately via Razorpay, or rejects with reason modal (`POST /api/user/quotations/:id/reject`).

### 4.4 Customer Booking & Order Tracking Module
* **Purpose**: Track all service bookings and physical product deliveries with status progression and action buttons.
* **Screens/Components**: `BookingsPage.js`, `BookingDetailPage.js`.
* **Status Badges**: `pending`, `active`, `assigned`, `in_progress`, `completed`, `cancelled`, `paid`.
* **Actions Available**:
  * Cancel active booking with reason picker (`PUT /api/user/booking/cancel/:id`).
  * Pay completed service via Razorpay or declare cash payment.
  * View technician profile and completed work photos gallery.
  * Download official tax invoice receipt (`InvoiceModal.js`).
  * Re-order completed service via "Book Again" (`POST /api/user/booking/book-again`).

### 4.5 Customer Payments Portal Module
* **Purpose**: Dedicated portal for monitoring pending dues, captured payments, refund history, and downloadable tax invoices.
* **Screens/Components**: `PaymentsPage.js`, `PaymentManagementModal.js`, `PaymentMethodsPage.js`.
* **Supported Modes**: Razorpay Online (UPI, Credit/Debit Cards, Netbanking) and Cash to Technician.

---

## 5. USER ROLES

The customer web frontend is strictly built for the **Customer** role:

| Dimension | Customer Role Scope in Web Application |
| :--- | :--- |
| **Accessible Screens** | Home, Services, Products, Product Details, Cart, Checkout, Bookings, Booking Details, Quotations, Payments, Account, Settings, Ratings, Reports, Help, Legal |
| **Restricted Screens** | Technician Job Queue, Admin Dashboard, Financial Ledger Management, Technician Payout Console (**Not found in customer frontend**) |
| **Guest Capabilities** | Browse services & products, view details, search catalog, add items (prompts login on checkout/actions) |
| **Logged-in Capabilities**| Place orders, schedule service slots, accept/reject quotations, make online payments, declare cash, track bookings, submit ratings, report disputes |

> [!NOTE]
> **Cross-Role Guard**: If an `adminToken` or user object with role `ADMIN`, `TECHNICIAN`, `OWNER`, or `SUPERADMIN` exists in localStorage (e.g. from local development domain sharing), `App.js` and `api.js` automatically purge the token to prevent accidental cross-role contamination.

---

## 6. SCREEN-BY-SCREEN DOCUMENTATION (19 SCREENS)

### 1. `HomePage.js` (Route: `/` or `/home`)
* **Purpose**: Primary landing page showcasing hero banners, service categories, top services, product highlights, platform metrics, and search.
* **Components Used**: `Navbar`, `SearchDropdown`, `Footer`, `BottomNav`, `ServiceSheet`, `AuthDialog`.
* **State**: `heroBannerIndex`, `categoryFilter`, `servicesList`, `isDataLoaded`.
* **APIs**: `getAllCategories`, `getAllServices`, `getAllProducts`.

### 2. `ServicePage.js` (Route: `/services`)
* **Purpose**: Full catalog of doorstep services with category tabs, search filtering, pricing cards, and quick add-to-cart buttons.
* **Components Used**: Category sidebar/tabs, Service Card, `ServiceSheet`, `PayNowButton`.
* **State**: `selectedCategory`, `searchQuery`, `priceRangeFilter`.
* **APIs**: `getAllServices`, `getAllCategories`, `addToCart`, `updateCartItem`.

### 3. `ProductServices.js` (Route: `/product-services`)
* **Purpose**: Filtered listing of services and products dynamically matched by query parameter (`?type=`).
* **Components Used**: Filter bar, Service/Product Card, `ServiceSheet`.

### 4. `ProductPage.js` (Route: `/products`)
* **Purpose**: E-commerce catalog for physical products, parts, and hardware accessories.
* **Components Used**: Product Card, Stock Badge, Category Filter, `QuoteRequestModal`.
* **State**: `selectedCategory`, `searchQuery`, `quoteModalProduct`.

### 5. `ProductDetailPage.js` (Route: `/product-detail`)
* **Purpose**: Detailed specifications, multi-image preview gallery, discount percentage calculations, and custom quote CTA.
* **State**: `activeImageIndex`, `quantity`, `customRequirements`.
* **APIs**: `getOneProduct`, `addToCart`.

### 6. `CartPage.js` (Route: `/cart`)
* **Purpose**: Unified cart management for both service bookings and physical products.
* **Features**: Service date/time slot picker, item quantity adjustments, live tax calculation, proceed to checkout button.
* **APIs**: `getMyCart`, `updateCartItem`, `removeFromCart`, `setSchedule`.

### 7. `CheckoutPage.js` (Route: `/checkout`)
* **Purpose**: Final checkout confirmation with delivery address selector, new address modal, time slot review, and payment mode choice.
* **Components Used**: `AddressModal`, Order Summary Card, Payment Mode Selector.
* **APIs**: `getMyAddresses`, `checkout`.

### 8. `BookingsPage.js` (Route: `/bookings`)
* **Purpose**: Master list of customer service bookings with filter tabs (`All`, `Active`, `Completed`, `Cancelled`).
* **Actions**: Cancel booking modal, Book Again button, Pay Now trigger, View Details.
* **APIs**: `getCustomerBookings`, `cancelBooking`, `bookAgain`.

### 9. `BookingDetailPage.js` (Route: `/bookings/:id`)
* **Purpose**: Detailed booking status timeline, technician details, work photos gallery, invoice receipt, and review prompt.
* **Components Used**: `InvoiceModal`, `ConfirmModal`.
* **APIs**: `getBookingById`, `downloadReceipt`.

### 10. `QuotationsPage.js` (Route: `/quotations`)
* **Purpose**: Management of custom price quote requests and received formal quotations.
* **Features**: 24-hour countdown timer, admin notes & terms parser, accept & instant Razorpay checkout, reject quote modal.
* **APIs**: `listMyQuotations`, `listMyQuoteRequests`, `acceptQuotation`, `rejectQuotation`, `createPaymentOrder`, `verifyPayment`.

### 11. `PaymentsPage.js` (Route: `/payments`)
* **Purpose**: Customer payments portal for outstanding dues, captured transactions, retry attempts, cash declarations, and invoices.
* **Components Used**: `PaymentManagementModal`, `InvoiceModal`.
* **APIs**: `listMyPayments`, `getPaymentSummary`, `getPaymentDetail`, `retryPayment`, `declareCashPayment`.

### 12. `PaymentMethodsPage.js` (Route: `/payment-methods`)
* **Purpose**: Informational guide on supported payment instruments (UPI, Cards, Netbanking, Cash).

### 13. `AccountPage.js` (Route: `/account`)
* **Purpose**: Customer profile management (name, phone, email), delivery addresses manager, orders shortcuts, theme switcher, and logout.
* **Components Used**: `AddressModal`, `ConfirmModal`.
* **APIs**: `getMyProfile`, `updateProfile`, `getMyAddresses`, `deleteAddress`.

### 14. `SettingsPage.js` (Route: `/settings`)
* **Purpose**: Application preferences, dark mode toggle, notification toggles, legal links.

### 15. `RatingsPage.js` (Route: `/ratings`)
* **Purpose**: List of customer ratings and feedback reviews with 5-star rating submission modal.
* **APIs**: `getMyRatings`, `createRating`, `updateRating`, `deleteRating`.

### 16. `ReportPage.js` (Route: `/report`)
* **Purpose**: Dispute ticket submission with issue category picker, problem description, photo proof attachment, and ticket history.
* **APIs**: `createReport`, `getMyReports`, `getReportCategories`.

### 17. `HelpSupportPage.js` (Route: `/help`)
* **Purpose**: Frequently asked questions accordion, customer care hotline, WhatsApp quick chat, and inquiry submission.

### 18. `AboutPage.js` (Route: `/about`)
* **Purpose**: Company profile, service guarantees, platform quality standards, and certified technician network info.

### 19. `LegalPage.js` (Route: `/privacy-policy` & `/terms-of-service`)
* **Purpose**: Legal terms, Privacy Policy, Terms of Service, Cancellation and Refund Policy.

---

## 7. NAVIGATION DOCUMENTATION

* **Navigation Library**: React Router DOM `v7.13.1`.
* **Router Type**: `HashRouter` (in `src/index.js`) ensuring seamless client-side routing on any static host or web server.
* **Smart Back Navigation**: `src/utils/browserUtils.js` implements `navStack` to track user navigation history and intelligently return to previous screens instead of hardcoded fallbacks.
* **Global Headers & Footers**:
  * **Desktop**: `Navbar.js` with category dropdowns, live search, cart counter, and profile menu.
  * **Mobile**: Persistent `global-mobile-header` with search dropdown and cart badge + `BottomNav.js` with 5 quick-access tabs.

---

## 8. COMPONENT DOCUMENTATION

| Component Name | File Path | Category | Purpose & Capabilities |
| :--- | :--- | :--- | :--- |
| **Navbar** | `src/components/Navbar.js` | UI / Navigation | Desktop top navigation bar with category menus, search dropdown, cart badge, and auth buttons |
| **BottomNav** | `src/components/BottomNav.js` | UI / Navigation | Mobile 5-tab bar (Home, Services, Bookings, Cart, Account) |
| **Footer** | `src/components/Footer.js` | UI / Layout | Global footer with quick service links, company info, and social channels |
| **ServiceSheet** | `src/components/ServiceSheet.js` | Presentation / Modal | Bottom sliding drawer showing service inclusions, exclusions, FAQs, and add-to-cart |
| **AuthDialog** | `src/components/AuthDialog.js` | Auth / Form Modal | Customer login dialog with 10-digit mobile number input, 6-digit OTP verification, and resend timer |
| **RegisterDialog** | `src/components/RegisterDialog.js` | Auth / Form Modal | Customer registration dialog with name, mobile, email, terms agreement, and OTP |
| **AddressModal** | `src/components/AddressModal.js` | Form Modal / Maps | Address creator/editor with OpenStreetMap search, reverse geocoding, and address tags |
| **SearchDropdown** | `src/components/SearchDropdown.js`| UI / Search | Live multi-entity search across services, products, and categories with instant jump |
| **QuoteRequestModal** | `src/components/QuoteRequestModal.js` | Form Modal | Custom price quote submission dialog for non-standard repairs and products |
| **InvoiceModal** | `src/components/InvoiceModal.js` | Presentation / Modal | Styled printable tax invoice viewer with itemized pricing, GST breakdown, and receipt export |
| **PaymentManagementModal** | `src/components/PaymentManagementModal.js`| Payment Modal | Due payment manager with online Razorpay trigger, retry order, and cash declaration |
| **ConfirmModal** | `src/components/ConfirmModal.js` | Generic Modal | Reusable confirmation modal with custom icons, colors, and confirmation callbacks |
| **RtAlert** | `src/components/RtAlert.js` | Alerts / Feedback | Custom toast notification container with color-coded badges (success, error, warning) |

---

## 9. API INTEGRATION FROM FRONTEND

| Feature | Method | API Endpoint | Frontend Service File | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Customer Signup** | `POST` | `/api/user/signup/customer` | `authServices.js` | Initiates customer signup & triggers OTP |
| **Signup OTP Verify** | `POST` | `/api/user/signup/customer/verify-otp` | `authServices.js` | Verifies signup OTP & issues JWT token |
| **Customer Login** | `POST` | `/api/user/login/customer` | `authServices.js` | Requests login OTP for mobile number |
| **Login OTP Verify** | `POST` | `/api/user/login/customer/verify-otp` | `authServices.js` | Verifies login OTP & returns customer token |
| **Get My Profile** | `GET` | `/api/user/me` | `userService.js` | Fetches authenticated customer profile |
| **Get My Cart** | `GET` | `/api/user/cart/my-cart` | `cartService.js` | Loads active customer cart and totals |
| **Add to Cart** | `POST` | `/api/user/cart/add` | `cartService.js` | Adds service or product item to cart |
| **Update Cart Item** | `PUT` | `/api/user/cart/update` | `cartService.js` | Adjusts item quantity in cart |
| **Remove from Cart** | `DELETE` | `/api/user/cart/remove/:id` | `cartService.js` | Deletes item from cart |
| **Schedule Slot** | `POST` | `/api/user/cart/set-schedule` | `cartService.js` | Sets scheduled date and time slot |
| **Checkout Cart** | `POST` | `/api/user/checkout` | `cartService.js` | Converts cart into immutable bookings |
| **Create Payment Order** | `POST` | `/api/user/payment/order` | `paymentService.js` | Creates Razorpay order from snapshot |
| **Verify Payment** | `POST` | `/api/user/payment/verify` | `paymentService.js` | Validates HMAC-SHA256 signature |
| **List My Bookings** | `GET` | `/api/user/booking/getCustomerBookings`| `bookingService.js` | Fetches customer service bookings |
| **Cancel Booking** | `PUT` | `/api/user/booking/cancel/:id` | `bookingService.js` | Cancels booking with structured reason |
| **Book Again** | `POST` | `/api/user/booking/book-again` | `bookingService.js` | Quick re-booking of completed service |
| **List My Quotations** | `GET` | `/api/user/quotations` | `quotationService.js` | Loads customer quotations |
| **Accept Quotation** | `POST` | `/api/user/quotations/:id/accept` | `quotationService.js` | Accepts formal quote and locks price |
| **Reject Quotation** | `POST` | `/api/user/quotations/:id/reject` | `quotationService.js` | Rejects quote with customer reason |
| **Get My Addresses** | `GET` | `/api/addresses` | `addressService.js` | Loads customer delivery addresses |
| **Create Address** | `POST` | `/api/addresses` | `addressService.js` | Saves address with coordinates |

---

## 10. STATE MANAGEMENT

1. **Global App State (`App.js`)**:
   * Global cache for categories (`serviceCategories`, `productCategories`), services (`allServices`), products (`allProducts`), and active cart (`cartItems`).
   * Fetched once on mount via `Promise.all` and cached in state.
2. **Optimistic Cart State**:
   * Immediate local state mutation when items are added, updated, or removed.
   * Auto-rolls back to previous state snapshot if backend API fails.
3. **Safe Storage Wrapper (`safeStorage`)**:
   * Handles Safari Private Browsing mode where standard `localStorage` throws exceptions.
4. **Custom Event Bus**:
   * `window.dispatchEvent(new Event('userProfileUpdated'))`: Syncs profile updates across header and account page.
   * `window.dispatchEvent(new Event('userLoggedOut'))`: Clears session state globally.

---

## 11. AUTHENTICATION & SESSION FLOW

```
Customer enters Mobile Number (10 digits)
       ↓
POST /api/user/login/customer (Request OTP)
       ↓
Customer enters 6-digit OTP
       ↓
POST /api/user/login/customer/verify-otp
       ↓
Response returns { token, user }
       ↓
safeStorage.setItem('token', token) & safeStorage.setItem('currentUser', JSON.stringify(user))
       ↓
Fetch active cart & update App.js state
```

* **Token Attachment**: `src/api/api.js` automatically attaches `Authorization: Bearer <token>` to all authenticated HTTP requests.
* **401 Unauthorized Protection**: If a 401 error is received for genuine user token expiry (e.g. `jwt expired`, `user not found`), the session is wiped. Crucially, 401 errors from 3rd-party payment gateways (such as test key errors) are isolated and do **not** log out the user.

---

## 12. FORMS & VALIDATION

| Form Name | Field Elements | Validation Rules | Error Messaging |
| :--- | :--- | :--- | :--- |
| **Customer Login Form** | Mobile Number, OTP | 10 digits (`^[6-9]\d{9}$`), 6 numeric digits for OTP | "Please enter a valid 10-digit mobile number" |
| **Customer Signup Form** | First Name, Last Name, Mobile, Email, Terms Checkbox | Name min 2 chars, valid email, phone regex, terms required | "You must accept Terms & Conditions" |
| **Address Form** | Address Line, City, State, Pincode, Address Type | Pincode 6 digits, Address min 5 chars, Type required | "Please enter complete delivery address" |
| **Quote Request Form** | Product, Quantity, Description, Mobile | Quantity >= 1, Description min 10 chars | "Please describe your custom requirements" |
| **Rating Form** | Star Rating (1-5), Feedback Review | Star rating mandatory (1-5), review text optional | "Please select a star rating" |
| **Report Issue Form** | Booking ID, Category, Description, Photo Attachment | Category selected, Description min 15 chars | "Please provide detailed issue description" |

---

## 13. FRONTEND DATA FLOW

```
User Action (Click / Submit)
       ↓
React Component (e.g., CartPage)
       ↓
Local / Optimistic State Mutation
       ↓
API Service Call (e.g., cartService.addToCart)
       ↓
Centralized Fetch Client (apiClient with Bearer Token)
       ↓
Backend Server API
       ↓
Precision Response Received
       ↓
State Synced & UI Updated
       ↓
Toast Notification Displayed (RtAlert)
```

---

## 14. BOOKING FLOW

```
1. Service Selection (HomePage / ServicePage / ProductServices)
       ↓
2. Add to Cart (Optimistic State Update)
       ↓
3. Slot Scheduling in CartPage (Select Date & 2-Hour Time Slot)
       ↓
4. Proceed to CheckoutPage (Select / Add Doorstep Address)
       ↓
5. Place Order (POST /api/user/checkout -> ServiceBooking Created)
       ↓
6. Technician Assigned & Service Delivered (status: "completed")
       ↓
7. Pay-at-Completion (Razorpay Online Checkout or Cash Declaration)
       ↓
8. Download Tax Invoice & Submit 5-Star Rating
```

---

## 15. PAYMENT FRONTEND FLOW

* **Service Bookings**: Post-Service Completion flow. Payment triggers once status is marked `completed`.
* **Product / Quotation Orders**: Pre-Payment flow. Customer pays upfront during checkout or quotation acceptance.
* **Razorpay Web SDK**: `src/utils/razorpay.js` dynamically injects `https://checkout.razorpay.com/v1/checkout.js` into the DOM.
* **Fast-Path Verification**: Once Razorpay checkout completes, `POST /api/user/payment/verify` sends `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to finalize booking status and unlock invoice receipts.

---

## 16. REAL-TIME FRONTEND FLOW

* **WebSocket / Socket.IO**: **Not found in frontend code.**
* Real-time synchronization is handled via lifecycle triggers, route transitions, and user-initiated refresh actions.

---

## 17. GEOLOCATION / MAP FRONTEND

* **OpenStreetMap Nominatim API**: Integrated in `src/services/addressService.js`.
* **Address Search**: `searchAddress(query)` queries OpenStreetMap with autocomplete matching.
* **Reverse Geocoding**: `reverseNominatim(lat, lng)` parses street, city, state, and pincode with a 5-second timeout and fallback.
* **HTML5 Geolocation**: `navigator.geolocation.getCurrentPosition` retrieves GPS coordinates for automatic address pinpointing.

---

## 18. FILE & IMAGE UPLOAD

* **Dispute Ticket Uploads**: `ReportPage.js` allows customers to attach photo proofs for quality complaints.
* **Quotation Attachments**: `QuoteRequestModal.js` supports optional specification file uploads.

---

## 19. ERROR HANDLING

* **Custom Alert Banner**: `RtAlert.js` displays non-intrusive animated toast alerts.
* **Network & API Interceptors**: `api.js` intercepts network failures and parses structured error messages from backend responses.
* **Empty State Handlers**: Clean, contextual empty state screens across Cart, Bookings, Quotations, and Payments.

---

## 20. UI/UX DESIGN SYSTEM

* **Primary Palette**: Emerald Green (`#16a34a`, `#15803d`, `#22c55e`).
* **Dark Mode Support**: Full native dark mode toggle stored in `safeStorage` and applied to `document.body`.
* **Typography**: System font stack (`system-ui`, `-apple-system`, `Segoe UI`, `Roboto`, `sans-serif`).
* **Mobile-First Responsiveness**: Tailored mobile headers, slide-up bottom sheets, and 5-tab bottom navigation bar.

---

## 21. FRONTEND SECURITY

* **Safe Storage**: Uses `safeStorage` wrapper to prevent crashes in private browsing mode.
* **Role Session Isolation**: Automatically clears stale admin/technician tokens on customer app initialization.
* **Mixed Content Detection**: Logs console warnings if an HTTPS origin attempts to make insecure HTTP API calls.

---

## 22. ENVIRONMENT & CONFIGURATION

| Variable | Description |
| :--- | :--- |
| `REACT_APP_API_URL` | Base URL of the backend REST API server |
| `REACT_APP_RAZORPAY_KEY_ID` | Razorpay Public Key ID used for checkout SDK |
| `GENERATE_SOURCEMAP` | Set to `false` in production build script |

---

## 23. DEPENDENCY ANALYSIS

| Package | Version | Role in Application |
| :--- | :--- | :--- |
| `react` & `react-dom` | `^19.2.4` | Core UI library with React 19 concurrent features |
| `react-router-dom` | `^7.13.1` | Client-side routing with HashRouter |
| `lucide-react` | `^0.575.0` | Modern SVG icons |
| `react-icons` | `^5.5.0` | Comprehensive icon sets (Material, Feather, FontAwesome) |
| `goey-toast` | `^0.3.0` | Toast notifications |
| `web-vitals` | `^2.1.4` | Performance metrics tracking |

---

## 24. FRONTEND FLOW DIAGRAMS

```
+-------------------------------------------------------------+
|                      CUSTOMER FLOW                          |
+-------------------------------------------------------------+
  1. Browse Services & Products (Home / Services / Products)
                                ↓
  2. Add Items to Cart (Optimistic State Update)
                                ↓
  3. Select Service Date & 2-Hour Time Slot (CartPage)
                                ↓
  4. Select Doorstep Delivery Address (CheckoutPage)
                                ↓
  5. Place Order (POST /api/user/checkout)
                                ↓
  6. Technician Delivers Service (status: "completed")
                                ↓
  7. Pay Online via Razorpay or Declare Cash
                                ↓
  8. Download Tax Invoice Receipt & Rate Service
```

---

## 25. FRONTEND TRACEABILITY MATRIX

| Feature Requirement | Screen Component | API Service | State Variables | Validation Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Customer Login / Signup** | `AuthDialog.js`, `RegisterDialog.js` | `authServices.js` | `currentUser`, `showLoginDialog` | 10-digit mobile, 6-digit OTP |
| **Service Catalog** | `ServicePage.js`, `ServiceSheet.js` | `serviceService.js` | `allServices`, `serviceCategories` | Category filter selection |
| **Cart Management** | `CartPage.js` | `cartService.js` | `cartItems`, `optimisticItems` | Quantity > 0, valid slot |
| **Checkout & Address** | `CheckoutPage.js`, `AddressModal.js`| `addressService.js`, `cartService.js` | `selectedAddress`, `paymentMode` | Complete address, terms accepted |
| **Bookings Tracking** | `BookingsPage.js`, `BookingDetailPage.js` | `bookingService.js` | `bookings`, `activeCategory` | Active tab filter |
| **Product Quotations**| `QuotationsPage.js`, `QuoteRequestModal.js` | `quotationService.js` | `quotations`, `quoteRequests` | 24h expiration check |
| **Payment Execution** | `PaymentsPage.js`, `PayNowButton.js` | `paymentService.js` | `paymentAttempts`, `activeOrder` | Razorpay HMAC signature |
| **Dispute Reporting** | `ReportPage.js` | `reportService.js` | `reports`, `activeDispute` | Description & Category required |

---

## 26. FRONTEND GAPS & TECHNICAL OBSERVATIONS

1. **Partially Implemented**: `ChatWindow.js` is present in the `src/components/` directory but is commented out in `App.js`.
2. **Not Found in Frontend**: Real-time WebSockets / Socket.IO are not implemented; the application uses REST pull and route lifecycle triggers.
3. **Resolved**: Terms & Conditions parsing in `QuotationsPage.js` was refined to prevent header tags (`[Terms & Conditions]:`) from being rendered as numbered list items.

---

## 27. FINAL FRONTEND SUMMARY

* **Architecture**: Clean, component-driven React 19 architecture with HashRouter.
* **Key Strengths**: Optimistic cart state management, cross-browser Safari support, strict role session isolation, OpenStreetMap Nominatim integration, and robust Razorpay payment flows.
* **Documentation Artifacts**:
  * Word Document: `RightTouch_Customer_Frontend_Technical_Documentation.docx`
  * Markdown File: `CUSTOMER_FRONTEND_TECHNICAL_DOCUMENTATION.md`
