const request = require('supertest');
const app = require('./app');
const { connect, closeDatabase, clearDatabase } = require('./tests/helpers/database');
const TempRegistration = require('./models/TempRegistration');
const User = require('./models/User');

async function runTest() {
  await connect();
  await clearDatabase();
  
  console.log('\n1. Creating TempRegistration...');
  const tempReg = await TempRegistration.create({
    phone: '+12125551234',
    userType: 'Creator',
    otpCode: '123456',
    verificationId: 123456,
    otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    otpSentAt: new Date()
  });
  console.log('Created:', { phone: tempReg.phone, otpCode: tempReg.otpCode });
  
  console.log('\n2. Checking for existing users...');
  const existingUsers = await User.find({ phone: '+12125551234' });
  console.log('Existing users found:', existingUsers.length);
  
  console.log('\n3. Sending wrong OTP...');
  const response = await request(app)
    .post('/api/auth/register/verify-otp')
    .send({
      phone: '+12125551234',
      code: '999999',
      deviceToken: 'test-device-token'
    });
  
  console.log('\n4. Response:');
  console.log('Status:', response.status);
  console.log('Body:', JSON.stringify(response.body, null, 2));
  
  console.log('\n5. Checking database after request...');
  const tempRegAfter = await TempRegistration.findOne({ phone: '+12125551234' });
  console.log('TempRegistration after:', tempRegAfter ? 'EXISTS' : 'DELETED');
  
  const userAfter = await User.findOne({ phone: '+12125551234' });
  console.log('User after:', userAfter ? { phone: userAfter.phone, isActive: userAfter.isActive } : 'NOT CREATED');
  
  await closeDatabase();
  process.exit(0);
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
