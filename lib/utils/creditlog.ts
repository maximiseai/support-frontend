import { connectMongoose } from '@/lib/mongodb';
import CreditLog from '@/lib/models/creditlog.model';

// Helper function to create a credit log (can be called from API routes)
export async function createCreditLog(logData: {
  support_user_id: string;
  support_user_email: string;
  team_id: string;
  team_name: string;
  action_type: 'refund' | 'credit_addition' | 'credit_deduction' | 'adjustment';
  amount: number;
  previous_balance: number;
  new_balance: number;
  reason?: string;
  metadata?: Record<string, any>;
}) {
  await connectMongoose();

  const log = await CreditLog.create({
    ...logData,
    created_at: new Date(),
  });

  return log;
}
