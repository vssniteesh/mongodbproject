const axios = require('axios');

// Test script to enable 2FA for a user
async function enable2FAForUser(email) {
  try {
    console.log(`🔐 Enabling 2FA for user: ${email}`);
    
    const response = await axios.post('http://localhost:5000/api/auth/test-enable-2fa', {
      email: email
    });
    
    console.log('✅ Success:', response.data.message);
    console.log('📧 User details:', response.data.user);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

// Usage: node test-2fa.js <email>
const email = process.argv[2];
if (!email) {
  console.log('Usage: node test-2fa.js <email>');
  console.log('Example: node test-2fa.js test@example.com');
  process.exit(1);
}

enable2FAForUser(email);
