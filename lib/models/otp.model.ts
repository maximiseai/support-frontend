import { Schema, model, models, Model } from 'mongoose';
import crypto from 'crypto';

interface IOTP {
  email: string;
  otp: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IOTPMethods {}

interface IOTPModel extends Model<IOTP, {}, IOTPMethods> {
  findAndGenerateOTP(options: { email: string }): Promise<{ otp: string }>;
  get(options: { email: string; otp: string }): Promise<any>;
}

const otpSchema = new Schema<IOTP, IOTPModel>(
  {
    email: {
      type: String,
      required: true,
      match: /^\S+@\S+\.\S+$/,
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  },
  { timestamps: true }
);

// Generate a 6-digit OTP
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Static method to find or generate OTP
otpSchema.statics.findAndGenerateOTP = async function (options: { email: string }) {
  const { email } = options;
  const emailFormatted = email.toLowerCase().trim();

  // Delete any existing OTPs for this email
  await this.deleteMany({ email: emailFormatted });

  // Generate new OTP
  const otp = generateOTP();
  const otpDoc = await this.create({
    email: emailFormatted,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  });

  return { otp: otpDoc.otp };
};

// Static method to get and validate OTP
otpSchema.statics.get = async function (options: { email: string; otp: string }) {
  const { email, otp } = options;
  const emailFormatted = email.toLowerCase().trim();

  const otpDoc = await this.findOne({
    email: emailFormatted,
    otp,
  });

  if (!otpDoc) {
    return null;
  }

  // Check if OTP is expired
  if (new Date() > otpDoc.expiresAt) {
    await otpDoc.deleteOne();
    return null;
  }

  return otpDoc;
};

const OTP = (models.otps || model<IOTP, IOTPModel>('otps', otpSchema)) as IOTPModel;

export default OTP;
