const http = require('http');

// Simple test to enable 2FA for a user
function enable2FAForUser(email) {
  const postData = JSON.stringify({ email: email });
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/test-enable-2fa',
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
        console.log('📧 User details:', response.user);
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

// Usage: node test-2fa-simple.js <email>
const email = process.argv[2];
if (!email) {
  console.log('Usage: node test-2fa-simple.js <email>');
  console.log('Example: node test-2fa-simple.js test@example.com');
  process.exit(1);
}

console.log(`🔐 Enabling 2FA for user: ${email}`);
enable2FAForUser(email);
