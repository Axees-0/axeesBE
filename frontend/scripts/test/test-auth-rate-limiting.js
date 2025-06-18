const { AuthRateLimiter } = require('./utils/AuthRateLimiter.ts');

// Test the AuthRateLimiter class
async function testRateLimiting() {
  console.log('🧪 Testing Auth Rate Limiting...\n');
  
  const rateLimiter = new AuthRateLimiter();
  const testIdentifier = '+1234567890';
  
  // Test 1: First 5 attempts should be allowed
  console.log('Test 1: First 5 attempts should be allowed');
  for (let i = 1; i <= 5; i++) {
    const result = rateLimiter.checkAttempt(testIdentifier);
    console.log(`  Attempt ${i}: ${result.allowed ? '✅ Allowed' : '❌ Blocked'}`);
    if (result.allowed) {
      rateLimiter.recordFailedAttempt(testIdentifier);
    }
  }
  
  // Test 2: 6th attempt should be blocked with 1 second delay
  console.log('\nTest 2: 6th attempt should be blocked (1 second delay)');
  let result = rateLimiter.checkAttempt(testIdentifier);
  console.log(`  Attempt 6: ${result.allowed ? '✅ Allowed' : '❌ Blocked'}`);
  console.log(`  Wait time: ${result.waitTime} seconds`);
  console.log(`  Expected: 1 second`);
  console.log(`  ${result.waitTime === 1 ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test 3: 7th attempt should be blocked with 2 second delay
  if (!result.allowed) {
    rateLimiter.recordFailedAttempt(testIdentifier);
  }
  console.log('\nTest 3: 7th attempt should be blocked (2 second delay)');
  result = rateLimiter.checkAttempt(testIdentifier);
  console.log(`  Attempt 7: ${result.allowed ? '✅ Allowed' : '❌ Blocked'}`);
  console.log(`  Wait time: ${result.waitTime} seconds`);
  console.log(`  Expected: 2 seconds`);
  console.log(`  ${result.waitTime === 2 ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test 4: 8th attempt should be blocked with 4 second delay
  if (!result.allowed) {
    rateLimiter.recordFailedAttempt(testIdentifier);
  }
  console.log('\nTest 4: 8th attempt should be blocked (4 second delay)');
  result = rateLimiter.checkAttempt(testIdentifier);
  console.log(`  Attempt 8: ${result.allowed ? '✅ Allowed' : '❌ Blocked'}`);
  console.log(`  Wait time: ${result.waitTime} seconds`);
  console.log(`  Expected: 4 seconds`);
  console.log(`  ${result.waitTime === 4 ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test 5: Message formatting
  console.log('\nTest 5: User-friendly error messages');
  console.log(`  Message: "${result.message}"`);
  console.log(`  ${result.message.includes('Please try again') ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test 6: Reset on successful login
  console.log('\nTest 6: Reset attempts on successful login');
  rateLimiter.resetAttempts(testIdentifier);
  result = rateLimiter.checkAttempt(testIdentifier);
  console.log(`  After reset: ${result.allowed ? '✅ Allowed' : '❌ Blocked'}`);
  console.log(`  ${result.allowed ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test 7: Different identifiers tracked separately
  console.log('\nTest 7: Different identifiers tracked separately');
  const anotherIdentifier = '+0987654321';
  result = rateLimiter.checkAttempt(anotherIdentifier);
  console.log(`  New identifier: ${result.allowed ? '✅ Allowed' : '❌ Blocked'}`);
  console.log(`  ${result.allowed ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test 8: Max delay cap (5 minutes)
  console.log('\nTest 8: Maximum delay cap (5 minutes)');
  // Simulate many failed attempts
  for (let i = 0; i < 20; i++) {
    rateLimiter.checkAttempt(testIdentifier);
    rateLimiter.recordFailedAttempt(testIdentifier);
  }
  result = rateLimiter.checkAttempt(testIdentifier);
  console.log(`  After 20+ attempts: ${result.allowed ? '✅ Allowed' : '❌ Blocked'}`);
  console.log(`  Wait time: ${result.waitTime} seconds (${Math.floor(result.waitTime / 60)} minutes)`);
  console.log(`  Max expected: 300 seconds (5 minutes)`);
  console.log(`  ${result.waitTime <= 300 ? '✅ PASS' : '❌ FAIL'}`);
  
  // Cleanup
  rateLimiter.destroy();
  console.log('\n✨ Rate limiting tests complete!');
}

// Run tests
testRateLimiting().catch(console.error);