export const ENDPOINTS = {
  AUTH: {
    SIGNUP: "/api/user/signup/customer",
    SIGNUP_VERIFY: "/api/user/signup/customer/verify-otp",
    REQUEST_LOGIN_OTP: "/api/user/auth/login/request-otp",
    VERIFY_LOGIN_OTP: "/api/user/auth/login/verify-otp",
    RESEND_OTP: "/api/user/auth/login/request-otp",
    VERIFY_OTP: "/api/user/signup/customer/verify-otp",
    ACCEPT_TERMS: "/api/user/auth/accept-terms",
    LOGIN_CUSTOMER: "/api/user/login/customer",
    LOGIN_CUSTOMER_VERIFY: "/api/user/login/customer/verify-otp",
    // General & Owner auth endpoints
    SIGNUP_GENERAL: "/api/user/signup",
    RESEND_OTP_GENERAL: "/api/user/resend-otp",
    VERIFY_OTP_GENERAL: "/api/user/verify-otp",
    SET_PASSWORD: "/api/user/set-password",
    LOGIN_GENERAL: "/api/user/login",
    LOGIN_OWNER: "/api/user/login/owner",
    OWNER_SIGNUP: "/api/user/owner/signup",
    OWNER_VERIFY_OTP: "/api/user/owner/verify-otp",
    OWNER_SET_PASSWORD: "/api/user/owner/set-password",
    OWNER_LOGIN: "/api/user/owner/login"
  },

  USER: {
    GET_MY_PROFILE: "/api/user/me",
    COMPLETE_PROFILE: "/api/user/complete-profile",
    UPDATE_PROFILE: "/api/user/me",
    DELETE_MY_ACCOUNT: "/api/user/delete-my-account",
    DEBUG_CHECK_USER: (identifier) => `/api/user/debug/check-user/${identifier}`,
    GET_BY_ROLE_AND_ID: (role, id) => `/api/user/users/${role}/${id}`,
    GET_BY_ROLE: (role) => `/api/user/users/${role}`,
    DELETE_BY_ID: (id) => `/api/user/users/${id}`
  },

  ADDRESS: {
    CREATE: "/api/addresses",
    GET_ALL: "/api/addresses",
    GET_DEFAULT: "/api/addresses/default",
    UPDATE: "/api/addresses",
    SET_DEFAULT: "/api/addresses/default",
    DELETE: "/api/addresses",
    SEARCH: "/api/addresses/search",
    REVERSE: "/api/addresses/reverse",
    ADMIN_GET_ALL: "/api/addresses/admin/all",
    ADMIN_GET_BY_ID: (id) => `/api/addresses/admin/${id}`
  },

  CATEGORY: {
    GET_ALL: "/api/user/getAllcategory",
    GET_BY_ID: (id) => `/api/user/getByIdcategory/${id}`,
    CREATE: "/api/user/category",
    UPLOAD_IMAGE: "/api/user/category/upload-image",
    REMOVE_IMAGE: "/api/user/category/remove-image",
    UPDATE: (id) => `/api/user/updatecategory/${id}`,
    DELETE: (id) => `/api/user/deletecategory/${id}`
  },

  SERVICE: {
    GET_ALL: "/api/user/getAllServices",
    GET_BY_ID: (id) => `/api/user/getServiceById/${id}`,
    CREATE: "/api/user/service",
    UPLOAD_IMAGES: "/api/user/services/upload-images",
    REMOVE_IMAGE: "/api/user/services/remove-image",
    REPLACE_IMAGES: "/api/user/services/replace-images",
    UPDATE: (id) => `/api/user/updateService/${id}`,
    UPDATE_ZONE_RESTRICTION: (id) => `/api/user/service/${id}/zone-restriction`,
    DELETE: (id) => `/api/user/services/${id}`,
    GET_POLYGON: (id) => `/api/user/service/${id}/polygon`,
    SET_POLYGON: (id) => `/api/user/service/${id}/polygon`,
    REMOVE_POLYGON: (id) => `/api/user/service/${id}/polygon`
  },

  SERVICE_BOOKING: {
    GET_ALL: "/api/user/booking/getCustomerBookings",
    GET_SLOTS: "/api/user/booking/slots",
    SCHEDULE: "/api/user/booking/schedule",
    CANCEL: (id) => `/api/user/booking/cancel/${id}`,
    GET_REASONS: "/api/user/booking/reasons",
    GET_CUSTOMER_BOOKINGS: "/api/user/booking/getCustomerBookings",
    GET_COMPLETED: "/api/user/booking/completed-services",
    BOOK_AGAIN: "/api/user/booking/book-again",
    DELETE_ALL: "/api/user/booking/deleteAll",
    GET_BOOKINGS_LEGACY: "/api/user/service/booking",
    DELETE_SINGLE: (id) => `/api/user/booking/${id}`,
    DELETE_ADMIN: (id) => `/api/user/booking/admin/${id}`,
    GET_ALL_BOOKINGS: "/api/user/booking/getAllBookings",
    GET_BY_ID: (id) => `/api/user/booking/getBookingById/${id}`
  },

  PRODUCT: {
    GET_ALL: "/api/user/getProduct",
    GET_ONE: (id) => `/api/user/getOneProduct/${id}`,
    CREATE: "/api/user/product",
    UPLOAD_IMAGES: "/api/user/product/upload-images",
    REMOVE_IMAGE: "/api/user/product/remove-image",
    REPLACE_IMAGES: "/api/user/product/replace-images",
    UPDATE: (id) => `/api/user/updateProduct/${id}`,
    DELETE: (id) => `/api/user/deleteProduct/${id}`
  },

  PRODUCT_BOOKING: {
    GET_ALL: "/api/user/getAllProductBooking",
    UPDATE: (id) => `/api/user/productBookingUpdate/${id}`,
    CANCEL: (id) => `/api/user/productBookingCancel/${id}`
  },

  CART: {
    ADD: "/api/user/cart/add",
    GET_MY_CART: "/api/user/cart/my-cart",
    GET_ITEM: (id) => `/api/user/cart/${id}`,
    UPDATE: "/api/user/cart/update",
    UPDATE_BY_ID: (id) => `/api/user/cart/${id}`,
    SET_SCHEDULE: "/api/user/cart/set-schedule",
    REMOVE: (id) => `/api/user/cart/remove/${id}`,
    GET_BY_ID: (id) => `/api/user/carts/${id}`,
    REMOVE_UNRESTRICTED: (id) => `/api/user/cart/removed/${id}`,
    CHECKOUT: "/api/user/checkout"
  },

  RATING: {
    CREATE: "/api/user/rating",
    GET_ALL: "/api/user/getAllRatings",
    GET_BY_ID: (id) => `/api/user/getRatingById/${id}`,
    UPDATE: (id) => `/api/user/updateRating/${id}`,
    DELETE: (id) => `/api/user/deleteRating/${id}`,
    GET_MY_RATINGS: "/api/user/get-my-ratings",
    GET_RATINGS_LIST: "/api/user/ratings",
    GET_RATING_BY_ID_CUSTOMER: (id) => `/api/user/ratings/${id}`
  },

  REPORT: {
    CREATE: "/api/user/reports",
    GET_MINE: "/api/user/reports/mine",
    GET_BY_ID: (id) => `/api/user/reports/${id}`,
    GET_CATEGORIES: "/api/user/reports/categories",
    CREATE_LEGACY: "/api/user/report",
    GET_ALL: "/api/user/getAllReports",
    GET_MY_REPORTS_LEGACY: "/api/user/get-my-reports",
    GET_BY_ID_LEGACY: (id) => `/api/user/getReportById/${id}`,
    RESOLVE: (id) => `/api/user/report/resolve/${id}`
  },

  PAYMENT: {
    CREATE_ORDER: "/api/user/payment/order",
    VERIFY: "/api/user/payment/verify",
    GET_BY_BOOKING: (id) => `/api/user/payment/${id}`,
    LIST_MINE: "/api/user/payments",
    SUMMARY: "/api/user/payments/summary",
    GET_DETAIL: (bookingId) => `/api/user/payments/${bookingId}`,
    RECEIPT: (bookingId) => `/api/user/payments/${bookingId}/receipt`,
    REFUNDS: (bookingId) => `/api/user/payments/${bookingId}/refunds`,
    INITIATE: (bookingId) => `/api/user/payments/${bookingId}/order`,
    RETRY: (bookingId) => `/api/user/payments/${bookingId}/retry`,
    CASH_DECLARE: (bookingId) => `/api/user/payments/${bookingId}/cash/declare`,
    RAZORPAY_WEBHOOK: "/api/user/payment/webhook/razorpay",
    UPDATE_STATUS: (id) => `/api/user/payment/${id}/status`,
    RETRY_SETTLEMENT: "/api/user/payment/retry-settlement"
  },

  CANCELLATION: {
    BOOKING_CANCEL: (id) => `/api/user/booking/cancel/${id}`,
    GET_REASONS: "/api/user/booking/reasons"
  },

  ZONE: {
    RESOLVE: "/api/zones/resolve",
    CHECK_SERVICE: "/api/zones/check-service"
  },

  DEV: {
    TEST_REDIS: "/api/dev/test-redis",
    FIND_TECHS: "/api/dev/find-techs"
  },

  NOTIFICATION: {
    LIST: "/api/user/notifications",
    UNREAD_COUNT: "/api/user/notifications/unread-count",
    MARK_READ: (id) => `/api/user/notifications/${id}/read`,
    MARK_ALL_READ: "/api/user/notifications/read-all",
    MARK_RECEIVED: (id) => `/api/user/notifications/${id}/received`,
    MARK_OPENED: (id) => `/api/user/notifications/${id}/opened`
  },

  PERMISSION: {
    UPDATE: "/api/user/permissions",
    GET_MINE: "/api/user/permissions"
  },

  DEVICE_TOKEN: {
    REGISTER: "/api/user/device-token",
    UNREGISTER: "/api/user/device-token"
  },

  QUOTATION: {
    CREATE_QUOTE_REQUEST: "/api/user/product-quote-requests",
    UPDATE_QUOTE_REQUEST: (id) => `/api/user/product-quote-requests/${id}`,
    LIST_MY_QUOTE_REQUESTS: "/api/user/product-quote-requests",
    GET_QUOTE_REQUEST_BY_ID: (id) => `/api/user/product-quote-requests/${id}`,
    CANCEL_QUOTE_REQUEST: (id) => `/api/user/product-quote-requests/${id}/cancel`,
    LIST_MY_QUOTATIONS: "/api/user/quotations",
    GET_QUOTATION_BY_ID: (id) => `/api/user/quotations/${id}`,
    MARK_VIEWED: (id) => `/api/user/quotations/${id}/view`,
    ACCEPT: (id) => `/api/user/quotations/${id}/accept`,
    REJECT: (id) => `/api/user/quotations/${id}/reject`,
    DECLINE: (id) => `/api/user/quotations/${id}/decline`,
    CREATE_QUOTE_REQUEST_ALIAS: "/api/user/product-quotes/request",
    LIST_QUOTE_REQUESTS_ALIAS: "/api/user/product-quotes",
    GET_QUOTE_REQUEST_ALIAS_BY_ID: (id) => `/api/user/product-quotes/${id}`,
    LIST_PRODUCT_BOOKINGS: "/api/user/product-bookings",
    GET_PRODUCT_BOOKING_BY_ID: (id) => `/api/user/product-bookings/${id}`
  }
};