const http = require('http');

// Simple test to test forgot password functionality
function testForgotPassword(email) {
  const postData = JSON.stringify({ email: email });
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/forgot-password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ Success:', response.message);
        console.log('📧 Status Code:', res.statusCode);
        console.log('📧 Check server console for email preview URL (if using Ethereal)');
      } catch (error) {
        console.log('❌ Error parsing response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.write(postData);
  req.end();
}

// Usage: node test-forgot-password.js <email>
const email = process.argv[2];
if (!email) {
  console.log('Usage: node test-forgot-password.js <email>');
  console.log('Example: node test-forgot-password.js test@example.com');
  process.exit(1);
}

console.log(`📧 Testing forgot password for: ${email}`);
testForgotPassword(email);
