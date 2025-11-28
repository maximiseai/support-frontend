/**
 * Test the OTP endpoint directly
 */

const axios = require('axios');

async function testOTPEndpoint() {
  const email = 'vinayak20130@gmail.com'; // Replace with your email
  const url = 'http://localhost:3003/api/auth/otp';

  console.log(`Testing OTP endpoint with email: ${email}\n`);

  try {
    const response = await axios.post(url, { email });

    console.log('✅ Success!');
    console.log('Response:', response.data);
    console.log(`\n📧 Check ${email} inbox for the OTP email`);
  } catch (error) {
    if (error.response) {
      console.log('❌ Error:', error.response.status);
      console.log('Response:', error.response.data);
    } else {
      console.error('❌ Request failed:', error.message);
      console.log('\nMake sure the support-frontend server is running on http://localhost:3003');
    }
  }
}

testOTPEndpoint();