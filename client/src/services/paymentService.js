import api from '@/lib/api';

export const initializePayment = async (paymentData) => {
  try {
    const response = await api.post(`/api/payment/initiate`, paymentData);
    return response.data;
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
};

export const verifyPayment = async (txRef) => {
  try {
    const response = await api.get(`/api/payment/verify-payment/${txRef}`);
    return response.data;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};