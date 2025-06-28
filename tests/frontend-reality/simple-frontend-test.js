/**
 * Simple Frontend Health Test
 * Tests basic frontend availability without authentication requirements
 */

const https = require('https');
const http = require('http');

function makeSimpleRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const requestModule = isHttps ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: timeout,
      headers: {
        'User-Agent': 'AxeesBugHunter/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = requestModule.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testFrontendHealth() {
  console.log('🔍 Testing frontend health...');
  
  try {
    const response = await makeSimpleRequest('http://localhost:19006', 10000);
    
    console.log('✅ Frontend responding with status:', response.status);
    
    if (response.status >= 200 && response.status < 400) {
      console.log('✅ Frontend is healthy');
      
      // Check for React/Expo indicators
      if (response.data) {
        const isReactApp = response.data.includes('react') || 
                          response.data.includes('expo') ||
                          response.data.includes('webpack') ||
                          response.data.includes('__expo');
        
        console.log('React/Expo app detected:', isReactApp);
        
        if (response.data.length > 200) {
          console.log('Content preview:', response.data.substring(0, 200) + '...');
        } else {
          console.log('Content:', response.data);
        }
      }
      
      return true;
    } else {
      console.log('⚠️ Frontend returned unexpected status:', response.status);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Frontend health check failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Frontend server appears to be not running on port 19006');
      console.log('   Try running: npm run web');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Cannot resolve localhost - network issue');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Frontend server is not responding (timeout)');
    }
    
    return false;
  }
}

async function runBasicFrontendTests() {
  console.log('🚀 Running basic frontend tests...\n');
  
  const isHealthy = await testFrontendHealth();
  
  if (isHealthy) {
    console.log('\n✅ Frontend is ready for comprehensive bug hunting');
    console.log('💡 To run full bug hunt, configure credentials in .env file');
  } else {
    console.log('\n❌ Frontend is not ready');
    console.log('📋 Next steps:');
    console.log('   1. Start frontend server: npm run web');
    console.log('   2. Wait for compilation to complete');
    console.log('   3. Verify server is running on port 19006');
  }
  
  return isHealthy;
}

// Run if called directly
if (require.main === module) {
  runBasicFrontendTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testFrontendHealth, runBasicFrontendTests };