#!/usr/bin/env node

/**
 * Simple runner script for the frontend crawler
 */

const FrontendCrawler = require('./crawler');

async function main() {
  console.log('🕷️  AXEES FRONTEND CRAWLER');
  console.log('==========================\n');
  console.log('Testing all pages and interactions...');
  console.log('Make sure your dev server is running on http://localhost:8081\n');
  
  // Quick connectivity check
  const http = require('http');
  
  console.log('🔗 Checking server connectivity...');
  
  const checkServer = () => {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:8081', (res) => {
        console.log('✅ Server is running and responsive\n');
        resolve(true);
      });
      
      req.on('error', () => {
        console.log('❌ Server not responding on http://localhost:8081');
        console.log('   Please start your dev server with: npm run web\n');
        resolve(false);
      });
      
      req.setTimeout(5000, () => {
        console.log('⏰ Server check timed out');
        resolve(false);
      });
    });
  };
  
  const serverOk = await checkServer();
  if (!serverOk) {
    process.exit(1);
  }
  
  // Run the crawler
  const crawler = new FrontendCrawler();
  
  try {
    await crawler.initialize();
    await crawler.crawlAllPages();
    
    // Success exit code if no major issues
    const success = crawler.results.summary.pagesFailed === 0 && 
                   crawler.results.summary.totalErrors === 0;
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Crawler failed:', error.message);
    process.exit(1);
  } finally {
    await crawler.cleanup();
  }
}

main();