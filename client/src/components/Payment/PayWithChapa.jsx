// components/PayWithChapa.jsx
import axios from 'axios';
import api from '@/lib/api';

const PayWithChapa = ({ course, user }) => {
  const handlePayment = async () => {
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
      // Show sensible error to user
      const msg = err?.response?.data?.error || err?.message || 'Failed to initiate payment';
      try {
        // use global toast if available
        const { toast } = await import('sonner');
        toast.error(msg);
      } catch (e) {
        alert(msg);
      }
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
