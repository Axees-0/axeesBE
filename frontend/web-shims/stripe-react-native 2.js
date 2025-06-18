// Stub for @stripe/stripe-react-native on web
export const StripeProvider = ({ children }) => children;
export const useStripe = () => ({
  confirmPayment: async () => ({ error: { message: 'Stripe not available on web' } }),
  createPaymentMethod: async () => ({ error: { message: 'Stripe not available on web' } }),
});
export const CardField = () => null;
export default {};