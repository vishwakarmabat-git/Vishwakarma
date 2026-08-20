import apiClient from './apiClient';

export const orderService = {
  createOrder: async (cartData, shippingAddressId) => {
    try {
      return await apiClient.post('/orders/create.php', {
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
      return await apiClient.post('/payments/razorpay_create.php', {
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
      return await apiClient.post('/payments/razorpay_verify.php', paymentData);
    } catch (error) {
      console.error("Razorpay verification failed", error);
      throw error;
    }
  }
};
