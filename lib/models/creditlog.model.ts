import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICreditLog extends Document {
  support_user_id: mongoose.Types.ObjectId;
  support_user_email: string;
  team_id: mongoose.Types.ObjectId;
  team_name: string;
  action_type: 'refund' | 'credit_addition' | 'credit_deduction' | 'adjustment';
  amount: number;
  previous_balance: number;
  new_balance: number;
  reason?: string;
  metadata?: Record<string, any>;
  payment_status: 'pending' | 'received' | 'not_applicable';
  payment_date?: Date;
  created_at: Date;
}

const CreditLogSchema = new Schema<ICreditLog>({
  support_user_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  support_user_email: {
    type: String,
    required: true,
    index: true,
  },
  team_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Team',
    index: true,
  },
  team_name: {
    type: String,
    required: true,
    index: true,
  },
  action_type: {
    type: String,
    required: true,
    enum: ['refund', 'credit_addition', 'credit_deduction', 'adjustment'],
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  previous_balance: {
    type: Number,
    required: true,
  },
  new_balance: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    default: '',
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  payment_status: {
    type: String,
    enum: ['pending', 'received', 'not_applicable'],
    default: 'not_applicable',
    index: true,
  },
  payment_date: {
    type: Date,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  collection: 'credit-logs',
  timestamps: false,
});

// Create compound indexes for common queries
CreditLogSchema.index({ created_at: -1 });
CreditLogSchema.index({ team_id: 1, created_at: -1 });
CreditLogSchema.index({ support_user_email: 1, created_at: -1 });
CreditLogSchema.index({ action_type: 1, created_at: -1 });

const CreditLog: Model<ICreditLog> = mongoose.models.CreditLog || mongoose.model<ICreditLog>('CreditLog', CreditLogSchema);

export default CreditLog;
