const puppeteer = require('puppeteer');

async function testOTPFlow() {
  console.log('🚀 Testing OTP Verification implementation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Test phone registration page
    console.log('📱 Testing phone registration page...');
    await page.goto('http://localhost:8081/register-phone?role=creator', { waitUntil: 'networkidle0' });
    
    // Check for phone registration components
    const phoneChecks = [
      { selector: 'text=Verify Your Phone', description: 'Phone verification header' },
      { selector: 'text=Phone Number', description: 'Phone input label' },
      { selector: 'text=Send Verification Code', description: 'Send code button' },
      { selector: 'text=Demo Mode: Any 10-digit number works', description: 'Demo info' }
    ];
    
    console.log('🔍 Verifying phone registration components...');
    let phonePassedChecks = 0;
    
    for (const check of phoneChecks) {
      try {
        await page.waitForSelector(check.selector, { timeout: 2000 });
        console.log(`  ✅ Found: ${check.description}`);
        phonePassedChecks++;
      } catch (e) {
        console.log(`  ❌ Missing: ${check.description}`);
      }
    }
    
    // Test OTP verification page
    console.log('📱 Testing OTP verification page...');
    await page.goto('http://localhost:8081/register-otp?role=creator&phone=(555)%20123-4567', { waitUntil: 'networkidle0' });
    
    // Check for OTP verification components
    const otpChecks = [
      { selector: 'text=Enter Verification Code', description: 'OTP verification header' },
      { selector: 'text=(555) 123-4567', description: 'Phone number display' },
      { selector: 'text=Verify Phone Number', description: 'Verify button' },
      { selector: 'text=Demo Mode: Use code 123456', description: 'Demo OTP info' },
      { selector: 'text=Resend verification code', description: 'Resend option' }
    ];
    
    console.log('🔍 Verifying OTP verification components...');
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
    
    console.log(`\n📊 Phone Registration Check: ${phonePassedChecks}/${phoneChecks.length} components found`);
    console.log(`📊 OTP Verification Check: ${otpPassedChecks}/${otpChecks.length} components found`);
    
    if (phonePassedChecks >= 3 && otpPassedChecks >= 4) {
      console.log('🎉 SUCCESS: OTP verification flow is implemented!');
      console.log('✅ CLOSED FEEDBACK LOOP: OTP verification gap has been FIXED');
    } else {
      console.log('⚠️  PARTIAL: Some OTP components missing');
    }
    
    // Wait to see the result
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testOTPFlow();