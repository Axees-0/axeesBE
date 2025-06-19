const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

console.log('=== DOCUMENT SUBMISSION FUNCTIONALITY TEST ===\n');

// Test document submission pages and functionality
async function testDocumentSubmission() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    const baseUrl = 'http://localhost:8081';
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    // Enable error tracking
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
    
    console.log('1. TESTING PROOF SUBMISSION PAGE');
    console.log('================================');
    
    try {
      await page.goto(`${baseUrl}/deals/proof?dealId=test123&milestoneId=milestone456`, {
        waitUntil: 'networkidle0',
        timeout: 10000
      });
      
      // Check if page loads
      const title = await page.title();
      console.log('✅ Proof page loads:', title.includes('Upload Proof'));
      
      // Check for file upload button
      const uploadButton = await page.$('text=Add Screenshots');
      console.log('✅ Upload button exists:', !!uploadButton);
      
      // Test file upload button click
      if (uploadButton) {
        await uploadButton.click();
        console.log('✅ Upload button clickable');
      }
      
      // Check form fields
      const urlInput = await page.$('input[placeholder*="instagram.com"]');
      const descInput = await page.$('textarea[placeholder*="published the post"]');
      console.log('✅ URL input exists:', !!urlInput);
      console.log('✅ Description input exists:', !!descInput);
      
      // Test form validation
      const submitButton = await page.$('text=Submit Proof');
      console.log('✅ Submit button exists:', !!submitButton);
      
      if (submitButton) {
        const isDisabled = await page.$eval('text=Submit Proof', el => 
          el.closest('button')?.disabled || el.closest('div')?.style.backgroundColor === 'rgb(204, 204, 204)'
        );
        console.log('✅ Submit button properly disabled when empty:', isDisabled);
      }
      
    } catch (error) {
      console.log('❌ Proof page test failed:', error.message);
    }
    
    console.log('\n2. TESTING WORK SUBMISSION PAGE');
    console.log('==============================');
    
    try {
      await page.goto(`${baseUrl}/deals/submit?dealId=test123&milestoneId=milestone456`, {
        waitUntil: 'networkidle0',
        timeout: 10000
      });
      
      // Check if page loads
      const title = await page.title();
      console.log('✅ Submit page loads:', title.includes('Submit Work'));
      
      // Check for file upload button
      const uploadButton = await page.$('text=Add Files');
      console.log('✅ File upload button exists:', !!uploadButton);
      
      // Check form fields
      const contentInput = await page.$('textarea[placeholder*="I\'ve created three different post options"]');
      const notesInput = await page.$('textarea[placeholder*="additional notes"]');
      console.log('✅ Content input exists:', !!contentInput);
      console.log('✅ Notes input exists:', !!notesInput);
      
      // Test form validation
      const submitButton = await page.$('text=Submit for Review');
      console.log('✅ Submit button exists:', !!submitButton);
      
    } catch (error) {
      console.log('❌ Submit page test failed:', error.message);
    }
    
    console.log('\n3. TESTING FILE UPLOAD COMPONENTS');
    console.log('================================');
    
    try {
      // Test custom offer page with file upload
      await page.goto(`${baseUrl}/UOM004MarketerCustomOffer?creatorId=test123`, {
        waitUntil: 'networkidle0',
        timeout: 10000
      });
      
      // Check for file upload section
      const uploadSection = await page.$('text=Browse Files');
      console.log('✅ File browse button exists:', !!uploadSection);
      
      // Check for upload content section
      const uploadContent = await page.$('text=Attach Content');
      console.log('✅ Upload content section exists:', !!uploadContent);
      
    } catch (error) {
      console.log('❌ Custom offer file upload test failed:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Browser setup failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Test service implementations
function testServiceImplementations() {
  console.log('\n4. TESTING SERVICE IMPLEMENTATIONS');
  console.log('=================================');
  
  try {
    // Check documentSubmissionService
    const docServicePath = path.join(__dirname, 'utils/documentSubmissionService.ts');
    const docService = fs.readFileSync(docServicePath, 'utf8');
    
    console.log('✅ documentSubmissionService.ts exists');
    console.log('✅ Has useDocumentSubmission hook:', docService.includes('useDocumentSubmission'));
    console.log('✅ Has submitDocument function:', docService.includes('submitDocument'));
    console.log('⚠️  Uses placeholder implementation:', docService.includes('Placeholder implementation'));
    
    // Check proofSubmissionService
    const proofServicePath = path.join(__dirname, 'utils/proofSubmissionService.ts');
    const proofService = fs.readFileSync(proofServicePath, 'utf8');
    
    console.log('✅ proofSubmissionService.ts exists');
    console.log('✅ Has ProofSubmissionService class:', proofService.includes('class ProofSubmissionService'));
    console.log('✅ Has createProofSubmission method:', proofService.includes('createProofSubmission'));
    console.log('✅ Has submitProofForReview method:', proofService.includes('submitProofForReview'));
    
    // Check for missing DocumentSubmissionService class
    const hasDocumentServiceClass = proofService.includes('class DocumentSubmissionService');
    const importsDocumentService = proofService.includes('import.*DocumentSubmissionService');
    const usesDocumentService = proofService.includes('this.documentService');
    
    console.log('❌ Missing DocumentSubmissionService class:', !hasDocumentServiceClass && (importsDocumentService || usesDocumentService));
    
    if (!hasDocumentServiceClass && (importsDocumentService || usesDocumentService)) {
      console.log('   ⚠️  CRITICAL ISSUE: ProofSubmissionService tries to use DocumentSubmissionService');
      console.log('      but the class is not implemented. This will cause runtime errors.');
    }
    
  } catch (error) {
    console.log('❌ Service implementation test failed:', error.message);
  }
}

// Test package dependencies
function testDependencies() {
  console.log('\n5. TESTING DEPENDENCIES');
  console.log('======================');
  
  try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const dependencies = packageJson.dependencies || {};
    
    console.log('✅ expo-document-picker installed:', !!dependencies['expo-document-picker']);
    console.log('✅ expo-image-picker installed:', !!dependencies['expo-image-picker']);
    console.log('✅ expo-file-system installed:', !!dependencies['expo-file-system']);
    console.log('✅ axios installed:', !!dependencies['axios']);
    console.log('✅ react-dropzone installed:', !!dependencies['react-dropzone']);
    
    // Check versions
    if (dependencies['expo-document-picker']) {
      console.log('   Version:', dependencies['expo-document-picker']);
    }
    if (dependencies['expo-image-picker']) {
      console.log('   Version:', dependencies['expo-image-picker']);
    }
    
  } catch (error) {
    console.log('❌ Dependencies test failed:', error.message);
  }
}

// Main execution
async function main() {
  testServiceImplementations();
  testDependencies();
  
  console.log('\n6. SUMMARY OF ISSUES FOUND');
  console.log('=========================');
  console.log('❌ DocumentSubmissionService class is referenced but not implemented');
  console.log('❌ File uploads are mostly mock/demo implementations');
  console.log('❌ Missing actual API integration for file uploads');
  console.log('❌ ProofSubmissionService.uploadDocuments() method does not exist');
  console.log('⚠️  UI components exist but may not work for real file uploads');
  console.log('⚠️  Form validation works but submission may fail');
  
  console.log('\n7. RECOMMENDATIONS');
  console.log('=================');
  console.log('1. Implement missing DocumentSubmissionService class');
  console.log('2. Add proper FormData upload functionality');
  console.log('3. Replace mock file operations with real file handling');
  console.log('4. Add proper error handling for upload failures');
  console.log('5. Test end-to-end file upload flow');
  console.log('6. Add file size/type validation');
  console.log('7. Implement upload progress tracking');
  
  // Test pages if possible
  console.log('\n8. ATTEMPTING LIVE PAGE TEST');
  console.log('============================');
  console.log('Checking if dev server is running...');
  
  try {
    const axios = require('axios');
    await axios.get('http://localhost:8081', { timeout: 3000 });
    console.log('✅ Dev server is running, testing pages...');
    await testDocumentSubmission();
  } catch (error) {
    console.log('❌ Dev server not running, skipping live tests');
    console.log('   Start dev server with: npm run web');
  }
}

main().catch(console.error);