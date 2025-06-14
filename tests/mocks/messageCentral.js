// Mock for messageCentral.js
const sendOtp = jest.fn().mockResolvedValue({
  success: true,
  otp: '123456', // For testing purposes
  message: 'OTP sent successfully'
});

const getMessageCentralToken = jest.fn().mockResolvedValue('mock-token-12345');

module.exports = {
  sendOtp,
  getMessageCentralToken
};