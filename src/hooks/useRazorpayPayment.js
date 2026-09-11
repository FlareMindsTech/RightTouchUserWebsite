import { useState } from "react";
import { createPaymentOrder, verifyPayment } from "../services/paymentService";
import { loadRazorpayScript, resolveRazorpayKey } from "../utils/razorpay";

export const useRazorpayPayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initiatePayment = async ({
    bookingId,
    customerUser,
    onSuccess,
    onFailure,
  }) => {
    setLoading(true);
    setError(null);

    try {
      if (!bookingId) {
        throw new Error("Booking ID is required for payment");
      }

      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded && !window.Razorpay) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      // 2. Call backend to create Razorpay Order
      let orderRes;
      try {
        orderRes = await createPaymentOrder({ bookingId });
      } catch (orderErr) {
        if (orderErr?.message?.toLowerCase().includes("already paid")) {
          setLoading(false);
          if (onSuccess) {
            onSuccess({
              alreadyPaid: true,
              bookingId,
            });
          }
          return;
        }
        throw orderErr;
      }

      console.log("========== PAYMENT ORDER RESPONSE ==========");
      console.log("orderRes:", orderRes);
      console.log("result:", orderRes?.result);
      console.log("orderId:", orderRes?.result?.orderId);
      console.log("amount:", orderRes?.result?.amount);
      console.log("currency:", orderRes?.result?.currency);
      console.log("keyId:", orderRes?.result?.keyId);
      console.log("============================================");

      if (!orderRes?.success || !orderRes?.result) {
        throw new Error(orderRes?.message || "Failed to create payment order");
      }

      const resData = orderRes.result || orderRes.data || orderRes;
      const rawAmount = resData.amount;

      // 3. Free Booking Flow Bypass (₹0 Total)
      if (resData?.free === true || (rawAmount != null && Number(rawAmount) === 0)) {
        console.log("[useRazorpayPayment] Free booking flow bypass triggered.");
        setLoading(false);
        if (onSuccess) {
          onSuccess({
            free: true,
            paymentId: resData.paymentId,
            bookingId,
          });
        }
        return;
      }

      const {
        keyId,
        key,
        razorpayKey,
        razorpayKeyId,
        orderId,
        razorpayOrderId,
        razorpay_order_id,
        id,
        providerOrderId,
        currency,
        order,
      } = resData;

      const finalKey = resolveRazorpayKey({
        envKey: process.env.REACT_APP_RAZORPAY_KEY_ID,
        serverKey: keyId || key || razorpayKey || razorpayKeyId,
      });

      const finalOrderId = (
        orderId ||
        razorpayOrderId ||
        razorpay_order_id ||
        id ||
        providerOrderId ||
        order?.id ||
        ""
      ).trim();

      const finalCurrency = String(currency || "INR").toUpperCase();
      const amountInPaise = Math.round(Number(rawAmount));

      console.log("========== RAZORPAY OPTIONS ==========");
      console.log("Razorpay available:", !!window.Razorpay);
      console.log("Final key:", finalKey);
      console.log("Final order ID:", finalOrderId);
      console.log("Amount paise:", amountInPaise);
      console.log("Currency:", finalCurrency);
      console.log("======================================");

      if (!finalKey) throw new Error("Razorpay Key ID is missing");
      if (!finalOrderId) throw new Error("Razorpay Order ID is missing");
      if (!amountInPaise || amountInPaise < 100) {
        throw new Error("Minimum payment amount is ₹1.00 (100 paise)");
      }

      // Clean phone number
      const cleanPhone = (customerUser?.mobileNumber || customerUser?.phone || customerUser?.mobile || "").replace(/\D/g, "");
      const customerName = (
        customerUser?.name ||
        `${customerUser?.fname || ""} ${customerUser?.lname || ""}`.trim() ||
        "Customer"
      ).trim();

      // 4. Configure Razorpay Standard Checkout Options
      const options = {
        key: finalKey,
        amount: amountInPaise,
        currency: finalCurrency,
        name: "RightTouch",
        description: `Payment for Booking #${String(bookingId).slice(-6).toUpperCase()}`,
        order_id: finalOrderId,
        prefill: {
          name: customerName,
          email: (customerUser?.email || "").trim(),
          contact: cleanPhone.length >= 10 ? cleanPhone : "",
        },
        theme: {
          color: "#2DB84B",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            console.log("[Razorpay] Customer closed checkout modal without paying.");
          },
        },
        handler: async function (razorpayResponse) {
          try {
            console.log("[Razorpay Success] Response:", razorpayResponse);

            // 5. Send signature to backend for verification
            const verifyRes = await verifyPayment({
              bookingId,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            });

            if (!verifyRes?.success) {
              throw new Error(verifyRes?.message || "Payment verification failed");
            }

            setLoading(false);
            if (onSuccess) {
              onSuccess({
                verified: true,
                paymentId: razorpayResponse.razorpay_payment_id,
                bookingId,
                details: verifyRes.result,
              });
            }
          } catch (verifyErr) {
            setLoading(false);
            const errMsg = verifyErr.message || "Payment verification failed";
            setError(errMsg);
            if (onFailure) onFailure(verifyErr);
          }
        },
      };

      // 6. Open Razorpay Modal
      const rzp = new window.Razorpay(options);
      console.log("Razorpay instance created:", rzp);

      rzp.on("payment.failed", function (response) {
        console.error("RAZORPAY PAYMENT FAILED:", response);
        setLoading(false);
        const failMessage = response.error?.description || "Payment failed at gateway";
        setError(failMessage);
        if (onFailure) onFailure(new Error(failMessage));
      });

      console.log("Opening Razorpay...");
      rzp.open();
      console.log("Razorpay open() called");
    } catch (err) {
      setLoading(false);
      const errMsg = err.message || "Payment initialization failed";
      setError(errMsg);
      if (onFailure) onFailure(err);
    }
  };

  return { initiatePayment, loading, error };
};
