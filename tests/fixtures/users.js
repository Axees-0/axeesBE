const bcrypt = require('bcrypt');

/**
 * Test user fixtures
 */
const testUsers = {
  creator: {
    email: 'creator@test.com',
    password: 'Test123!',
    fullName: 'Test Creator',
    phoneNumber: '+12125551234',
    role: 'creator',
    accountType: 'creator',
    isVerified: true,
    isActive: true,
    handle: 'testcreator',
    socialMedia: {
      instagram: 'testcreator',
      tiktok: 'testcreator',
      youtube: 'testcreator'
    },
    categories: ['lifestyle', 'fashion'],
    bio: 'Test creator bio',
    location: 'New York, USA'
  },
  
  marketer: {
    email: 'marketer@test.com',
    password: 'Test123!',
    fullName: 'Test Marketer',
    phoneNumber: '+12125551235',
    role: 'marketer',
    accountType: 'marketer',
    isVerified: true,
    isActive: true,
    companyName: 'Test Company Inc',
    website: 'https://testcompany.com',
    industry: 'Technology',
    description: 'Test company description'
  },
  
  unverifiedUser: {
    email: 'unverified@test.com',
    password: 'Test123!',
    fullName: 'Unverified User',
    phoneNumber: '+12125551236',
    role: 'creator',
    accountType: 'creator',
    isVerified: false,
    isActive: true
  }
};

/**
 * Hash passwords for test users
 */
const hashPasswords = async () => {
  const hashedUsers = {};
  
  for (const [key, user] of Object.entries(testUsers)) {
    hashedUsers[key] = {
      ...user,
      password: await bcrypt.hash(user.password, 10)
    };
  }
  
  return hashedUsers;
};

/**
 * Create user without password for response comparisons
 */
const sanitizeUser = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

module.exports = {
  testUsers,
  hashPasswords,
  sanitizeUser
};