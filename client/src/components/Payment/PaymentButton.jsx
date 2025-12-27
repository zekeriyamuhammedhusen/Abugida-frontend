import { useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';

export const PaymentButton = ({ courseId, amount, email, firstName, lastName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post(`/api/payment/initiate`, {
        amount,
        email,
        fullName: `${firstName} ${lastName}`,
        studentId: null,
        courseId,
      });

      const checkoutUrl = response.data.checkoutUrl;
      if (checkoutUrl) {
        const popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
        let setFailed = false;
        if (popup) {
          try {
            popup.location.href = checkoutUrl;
            try { popup.focus(); } catch (e) { /* ignore */ }
          } catch (e) {
            setFailed = true;
          }
        }

        setTimeout(() => {
          try {
            if (!popup || popup.closed) {
              window.location.href = checkoutUrl;
              return;
            }
            if (setFailed) {
              const newTab = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
              if (!newTab) window.location.href = checkoutUrl;
            }
          } catch (e) {
            window.location.href = checkoutUrl;
          }
        }, 1500);
      } else {
        setError('Payment initialization failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Processing...' : 'Pay with Chapa'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default PaymentButton;