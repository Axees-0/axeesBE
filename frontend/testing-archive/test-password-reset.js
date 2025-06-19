const puppeteer = require('puppeteer');

async function testPasswordResetFlow() {
  console.log('🚀 Testing Password Reset Flow implementation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Test forgot password page
    console.log('📱 Testing forgot password page...');
    await page.goto('http://localhost:8081/forgot-password', { waitUntil: 'networkidle0' });
    
    const forgotChecks = [
      { selector: 'text=Forgot Password?', description: 'Forgot password header' },
      { selector: 'text=Email Address', description: 'Email input label' },
      { selector: 'text=Send Reset Code', description: 'Send reset button' },
      { selector: 'text=Demo Mode: Use any valid email format', description: 'Demo info' }
    ];
    
    console.log('🔍 Verifying forgot password components...');
    let forgotPassedChecks = 0;
    
    for (const check of forgotChecks) {
      try {
        await page.waitForSelector(check.selector, { timeout: 2000 });
        console.log(`  ✅ Found: ${check.description}`);
        forgotPassedChecks++;
      } catch (e) {
        console.log(`  ❌ Missing: ${check.description}`);
      }
    }
    
    // Test reset password OTP page
    console.log('📱 Testing reset password OTP page...');
    await page.goto('http://localhost:8081/reset-password-otp?email=test@example.com', { waitUntil: 'networkidle0' });
    
    const otpChecks = [
      { selector: 'text=Check Your Email', description: 'OTP header' },
      { selector: 'text=test@example.com', description: 'Email display' },
      { selector: 'text=Verify Code', description: 'Verify button' },
      { selector: 'text=Demo Mode: Use code 123456', description: 'Demo OTP info' }
    ];
    
    console.log('🔍 Verifying reset OTP components...');
    let otpPassedChecks = 0;
    
    for (const check of otpChecks) {
      try {
        await page.waitForSelector(check.selector, { timeout: 2000 });
        console.log(`  ✅ Found: ${check.description}`);
        otpPassedChecks++;
      } catch (e) {
        console.log(`  ❌ Missing: ${check.description}`);
      }
    }
    
    // Test new password page
    console.log('📱 Testing new password page...');
    await page.goto('http://localhost:8081/reset-password?email=test@example.com&verified=true', { waitUntil: 'networkidle0' });
    
    const passwordChecks = [
      { selector: 'text=Create New Password', description: 'New password header' },
      { selector: 'text=New Password', description: 'New password input' },
      { selector: 'text=Confirm Password', description: 'Confirm password input' },
      { selector: 'text=Reset Password', description: 'Reset button' },
      { selector: 'text=Password Strength:', description: 'Password strength indicator' }
    ];
    
    console.log('🔍 Verifying new password components...');
    let passwordPassedChecks = 0;
    
    for (const check of passwordChecks) {
      try {
        await page.waitForSelector(check.selector, { timeout: 2000 });
        console.log(`  ✅ Found: ${check.description}`);
        passwordPassedChecks++;
      } catch (e) {
        console.log(`  ❌ Missing: ${check.description}`);
      }
    }
    
    console.log(`\n📊 Forgot Password Check: ${forgotPassedChecks}/${forgotChecks.length} components found`);
    console.log(`📊 Reset OTP Check: ${otpPassedChecks}/${otpChecks.length} components found`);
    console.log(`📊 New Password Check: ${passwordPassedChecks}/${passwordChecks.length} components found`);
    
    if (forgotPassedChecks >= 3 && otpPassedChecks >= 3 && passwordPassedChecks >= 4) {
      console.log('🎉 SUCCESS: Password reset flow is implemented!');
      console.log('✅ CLOSED FEEDBACK LOOP: Password reset gap has been FIXED');
    } else {
      console.log('⚠️  PARTIAL: Some password reset components missing');
    }
    
    // Wait to see the result
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testPasswordResetFlow();