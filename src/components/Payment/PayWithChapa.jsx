// components/PayWithChapa.jsx
import axios from 'axios';
import api from '@/lib/api';
import { toast } from "sonner";

const PayWithChapa = ({ course, user }) => {
  const handlePayment = async () => {
    // If user is not logged in, show a friendly message and stop
    if (!user || !user._id) {
      toast.error("Please create account to enroll in course");
      return;
    }
    // Open a blank window synchronously to avoid popup blockers, then set its location after init
    const popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
    try {
      const res = await api.post(`/api/payment/initiate`, {
        amount: course.price,
        email: user.email,
        fullName: user.name,
        studentId: user._id,
        courseId: course._id,
      });

      const checkoutUrl = res.data.checkoutUrl;

      if (!checkoutUrl) throw new Error('No checkout URL returned');

      let setFailed = false;
      if (popup) {
        try {
          popup.location.href = checkoutUrl;
          try { popup.focus(); } catch (e) { /* ignore focus errors */ }
        } catch (errSet) {
          setFailed = true;
        }
      }

      // After a short delay try a secondary fallback: if popup was blocked/failed, open checkout in current tab
      setTimeout(() => {
        try {
          if (!popup || popup.closed) {
            // popup blocked or closed -> navigate current tab
            window.location.href = checkoutUrl;
            return;
          }

          // If initial set failed, attempt to open a new tab directly to the checkout URL.
          if (setFailed) {
            const newTab = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
            if (!newTab) {
              // final fallback: same-tab navigation
              window.location.href = checkoutUrl;
            }
          }
        } catch (e) {
          // Any unexpected error -> same-tab navigation as last resort
          window.location.href = checkoutUrl;
        }
      }, 1500);
    } catch (err) {
      console.error('Payment initiation failed', err);
      // Map unauthorized/missing user to a clearer message
      const status = err?.response?.status;
      const isAuthError = status === 401 || status === 403;
      const msg = 'Please create account to enroll in course';
      toast.error(msg);
      // Close the popup if it was opened but initiation failed
      try {
        if (popup && !popup.closed) popup.close();
      } catch (closeErr) {
        // ignore
      }
    }
  };

  return (
    <button onClick={handlePayment} className="bg-green-600 text-white px-4 py-2 rounded-lg">
      Enroll with Chapa
    </button>
  );
};

export default PayWithChapa;
