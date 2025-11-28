/**
 * Test script to verify AWS SES configuration and email sending
 */

const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SES
const ses = new AWS.SES({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET || process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const noReplyEmail = process.env.NO_REPLY_EMAIL || 'team@enrich.so';

async function testSES() {
  console.log('Testing AWS SES Configuration...\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Not set'}`);
  console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Not set'}`);
  console.log(`AWS_ACCESS_KEY_SECRET: ${process.env.AWS_ACCESS_KEY_SECRET ? '✓ Set' : '✗ Not set'}`);
  console.log(`AWS_REGION: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`NO_REPLY_EMAIL: ${noReplyEmail}\n`);

  try {
    // 1. Check verified email addresses
    console.log('Checking verified email addresses...');
    const verifiedEmails = await ses.listVerifiedEmailAddresses().promise();
    console.log('Verified emails:', verifiedEmails.VerifiedEmailAddresses);

    if (!verifiedEmails.VerifiedEmailAddresses.includes(noReplyEmail)) {
      console.log(`\n⚠️  WARNING: ${noReplyEmail} is NOT verified in AWS SES!`);
      console.log('This could be why emails are not being sent.');
    } else {
      console.log(`✓ ${noReplyEmail} is verified`);
    }

    // 2. Check sending quota
    console.log('\nChecking sending quota...');
    const quota = await ses.getSendQuota().promise();
    console.log(`Max send rate: ${quota.MaxSendRate} emails/second`);
    console.log(`Max 24 hour send: ${quota.Max24HourSend}`);
    console.log(`Sent last 24 hours: ${quota.SentLast24Hours}`);

    // 3. Check if in sandbox mode
    console.log('\nChecking sandbox status...');
    const sandboxStatus = await ses.getAccountSendingEnabled().promise();
    console.log(`Account sending enabled: ${sandboxStatus.Enabled}`);

    if (quota.Max24HourSend < 1000) {
      console.log('\n⚠️  WARNING: Your AWS SES account appears to be in sandbox mode!');
      console.log('In sandbox mode, you can only send emails to verified email addresses.');
      console.log('To send to any email address, you need to request production access.');
    }

    // 4. Test sending an email
    const testEmail = 'vinayak20130@gmail.com'; // Your email for testing
    console.log(`\n4. Testing email send to ${testEmail}...`);
    console.log('(Make sure this email is verified if you are in sandbox mode)');

    const params = {
      Destination: {
        ToAddresses: [testEmail],
      },
      Source: `Enrich Support<${noReplyEmail}>`,
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>AWS SES Test Email</h2>
                <p>This is a test email from the Enrich Support Dashboard.</p>
                <p>If you receive this email, AWS SES is configured correctly!</p>
                <p>Test OTP: <strong>123456</strong></p>
                <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
              </div>
            `,
          },
          Text: {
            Charset: 'UTF-8',
            Data: `Test email from Enrich Support Dashboard. Test OTP: 123456`,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Test Email - Enrich Support Dashboard',
        },
      },
    };

    const result = await ses.sendEmail(params).promise();
    console.log('✓ Email sent successfully!');
    console.log('Message ID:', result.MessageId);
    console.log(`\nCheck ${testEmail} inbox for the test email.`);

  } catch (error) {
    console.error('\n✗ Error:', error.message);

    if (error.code === 'MessageRejected') {
      console.log('\nPossible reasons for MessageRejected:');
      console.log('1. Email address not verified (if in sandbox mode)');
      console.log('2. From address not verified');
      console.log('3. Account suspended or in review');
    } else if (error.code === 'InvalidParameterValue') {
      console.log('\nCheck that your FROM email address is verified in AWS SES');
    } else if (error.code === 'AccessDenied') {
      console.log('\nCheck your AWS credentials and IAM permissions for SES');
    }
  }
}

testSES();