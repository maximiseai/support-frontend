/**
 * AWS SES Email Service
 * Handles sending emails via AWS Simple Email Service
 * Matches implementation from databox-enrich-api-server
 */

import AWS from 'aws-sdk';
import { otpHTML } from '../templates/otp';

// Configure AWS SES
const ses = new AWS.SES({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
  region: process.env.AWS_REGION || 'us-east-1',
});

const noReplyEmail = process.env.NO_REPLY_EMAIL || 'team@enrich.so';

/**
 * Send email via AWS SES
 * @param params - AWS SES sendEmail parameters
 * @returns Promise with send result
 */
async function sendEmail(params: AWS.SES.SendEmailRequest): Promise<AWS.SES.SendEmailResponse> {
  try {
    const result = await ses.sendEmail(params).promise();
    console.log('Email sent successfully:', result.MessageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send OTP email to user
 * @param email - Recipient email address
 * @param otp - One-Time Password to send
 * @returns Promise with send result
 */
export async function sendOTP(email: string, otp: string): Promise<AWS.SES.SendEmailResponse> {
  const params: AWS.SES.SendEmailRequest = {
    Destination: {
      ToAddresses: [email],
    },
    Source: `Enrich<${noReplyEmail}>`,
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: otpHTML(otp),
        },
        Text: {
          Charset: 'UTF-8',
          Data: `Your OTP is: ${otp}`,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'Your Enrich Login Code',
      },
    },
    ReplyToAddresses: [noReplyEmail],
  };

  return sendEmail(params);
}
