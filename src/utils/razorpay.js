/**
 * Resolve the Razorpay key to use for checkout.
 *
 * The .env key (REACT_APP_RAZORPAY_KEY_ID) is the primary source — switching
 * it between the test/live key switches checkout mode. BUT the order is
 * created by the backend with the backend's own key, and Razorpay rejects
 * checkout if the key does not match the order's account. So:
 *
 *   - .env key matches the server key  -> use it (normal case, switch works)
 *   - .env key is empty                -> use the server key
 *   - .env key differs from server key -> log a loud error (backend is on a
 *     different key — update the backend .env too) and use the SERVER key so
 *     checkout never breaks with a 400.
 */
export const resolveRazorpayKey = ({ envKey, serverKey }) => {
  const env = String(envKey || "").trim();
  const server = String(serverKey || "").trim();

  if (env && server && env !== server) {
    console.error(
      `[Razorpay] REACT_APP_RAZORPAY_KEY_ID (${env}) does not match the key the order was created with (${server}). ` +
        "Using the server key. Fix the mismatch: set REACT_APP_RAZORPAY_KEY_ID to the same key the backend uses."
    );
    return server;
  }

  return env || server;
};