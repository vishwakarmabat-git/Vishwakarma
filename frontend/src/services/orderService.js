import apiClient from './apiClient';

export const orderService = {
  createOrder: async (cartData, shippingAddressId) => {
    try {
      return await apiClient.post('/v1/orders/', {
        cart: cartData,
        shipping_address_id: shippingAddressId
      });
    } catch (error) {
      console.error("Failed to create order", error);
      throw error;
    }
  },

  initiateRazorpay: async (amount, receiptId) => {
    try {
      return await apiClient.post('/v1/payments/razorpay/create', {
        amount: amount,
        currency: 'INR',
        receipt: receiptId
      });
    } catch (error) {
      console.error("Razorpay init failed", error);
      throw error;
    }
  },

  verifyRazorpay: async (paymentData) => {
    try {
      return await apiClient.post('/v1/payments/razorpay/verify', paymentData);
    } catch (error) {
      console.error("Razorpay verification failed", error);
      throw error;
    }
  },

  confirmCod: async (internalOrderId, amount) => {
    try {
      return await apiClient.post('/v1/payments/cod/confirm', {
        internal_order_id: internalOrderId,
        amount: amount
      });
    } catch (error) {
      console.error("COD confirmation failed", error);
      throw error;
    }
  }
};
