export const ENDPOINTS = {
  AUTH: {
    SIGNUP: "/api/user/signup/customer",
    REQUEST_LOGIN_OTP: "/api/user/auth/login/request-otp",
    VERIFY_LOGIN_OTP: "/api/user/auth/login/verify-otp",
    RESEND_OTP: "/api/user/auth/login/request-otp",
    VERIFY_OTP: "/api/user/signup/customer/verify-otp",
    ACCEPT_TERMS: "/api/user/auth/accept-terms",
    LOGIN_CUSTOMER: "/api/user/login/customer",
    LOGIN_CUSTOMER_VERIFY: "/api/user/login/customer/verify-otp"
  },

  USER: {
    GET_MY_PROFILE: "/api/user/me",
    COMPLETE_PROFILE: "/api/user/complete-profile",
    UPDATE_PROFILE: "/api/user/me",
    DELETE_MY_ACCOUNT: "/api/user/delete-my-account"
  },

  ADDRESS: {
    CREATE: "/api/addresses",
    GET_ALL: "/api/addresses",
    GET_DEFAULT: "/api/addresses/default",
    UPDATE: "/api/addresses",
    SET_DEFAULT: "/api/addresses/default",
    DELETE: "/api/addresses"
  },

  CART: {
    ADD: "/api/user/cart/add",
    GET_MY_CART: "/api/user/cart/my-cart",
    GET_BY_ID: (id) => `/api/user/carts/${id}`,
    UPDATE: "/api/user/cart/update",
    REMOVE: (id) => `/api/user/cart/remove/${id}`,
    SET_SCHEDULE: "/api/user/cart/set-schedule",
    GET_SLOTS: "/api/user/booking/slots",
    CHECKOUT: "/api/user/checkout"
  },

  CATEGORY: {
    GET_ALL: "/api/user/getAllcategory",
    GET_BY_ID: (id) => `/api/user/getByIdcategory/${id}`
  },

  PRODUCT: {
    GET_ALL: "/api/user/getProduct",
    GET_ONE: (id) => `/api/user/getOneProduct/${id}`
  },

  SERVICE: {
    GET_ALL: "/api/user/getAllServices",
    GET_BY_ID: (id) => `/api/user/getServiceById/${id}`
  },

  SERVICE_BOOKING: {
    GET_ALL: "/api/user/booking/getCustomerBookings",
    CANCEL: (id) => `/api/user/booking/cancel/${id}`,
    GET_CUSTOMER_BOOKINGS: "/api/user/booking/getCustomerBookings",
    GET_COMPLETED: "/api/user/booking/completed-services",
    GET_REASONS: "/api/user/booking/reasons",
    GET_SCHEDULE: "/api/user/booking/schedule",
    GET_SLOTS: "/api/user/booking/slots",
    BOOK_AGAIN: "/api/user/booking/book-again",
    DELETE_ALL: "/api/user/booking/deleteAll"
  },

  PRODUCT_BOOKING: {
    GET_ALL: "/api/user/getAllProductBooking",
    UPDATE: (id) => `/api/user/productBookingUpdate/${id}`,
    CANCEL: (id) => `/api/user/productBookingCancel/${id}`
  },

  RATING: {
    CREATE: "/api/user/rating",
    GET_MY_RATINGS: "/api/user/get-my-ratings",
    GET_BY_ID: (id) => `/api/user/getRatingById/${id}`,
    UPDATE: (id) => `/api/user/updateRating/${id}`,
    DELETE: (id) => `/api/user/deleteRating/${id}`
  },

  REPORT: {
    CREATE: "/api/user/report",
    GET_ALL: "/api/user/get-my-reports",
    GET_BY_ID: (id) => `/api/user/getReportById/${id}`
  },

  PAYMENT: {
    CREATE_ORDER: "/api/user/payment/order",
    VERIFY: "/api/user/payment/verify",
    GET_BY_BOOKING: (id) => `/api/user/payment/${id}`
  },

  CANCELLATION: {
    BOOKING_CANCEL: (id) => `/api/user/booking/cancel/${id}`,
    GET_REASONS: "/api/user/booking/reasons"
  },

  ZONE: {
    RESOLVE: "/api/zones/resolve",
    CHECK_SERVICE: "/api/zones/check-service"
  }
};