import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { connectMongoose } from '@/lib/mongodb';
import CreditLog from '@/lib/models/creditlog.model';
import User from '@/lib/models/user.model';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, amount, note, actionType = 'credit_addition' } = body;

    if (!teamId || !amount) {
      return NextResponse.json(
        { error: 'Team ID and amount are required' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');

    // Validate team exists
    let teamObjectId: ObjectId;
    try {
      teamObjectId = new ObjectId(teamId);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid team ID format' },
        { status: 400 }
      );
    }

    const team = await teamsCollection.findOne({ _id: teamObjectId });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Calculate balances based on action type
    const currentBaseCredit = team.base_credit || 0;
    const currentCreditsUsed = team.credits_used || 0;
    const currentAvailable = currentBaseCredit - currentCreditsUsed;

    let updateOperation: any;
    let newAvailable: number;

    if (actionType === 'refund') {
      // Refund: Decrease credits_used (gives back credits that were incorrectly charged)
      const newCreditsUsed = Math.max(0, currentCreditsUsed - amount); // Don't go below 0
      newAvailable = currentBaseCredit - newCreditsUsed;

      updateOperation = {
        $set: {
          credits_used: newCreditsUsed,
          updatedAt: new Date()
        },
        $push: {
          credit_history: {
            amount,
            note: note || 'Credits refunded by support',
            timestamp: new Date(),
            previous_credits_used: currentCreditsUsed,
            new_credits_used: newCreditsUsed,
            previous_available: currentAvailable,
            new_available: newAvailable,
            action_type: actionType,
          },
        } as any,
      };
    } else {
      // Credit addition: Increase base_credit
      const newBaseCredit = currentBaseCredit + amount;
      newAvailable = newBaseCredit - currentCreditsUsed;

      updateOperation = {
        $inc: { base_credit: amount },
        $set: { updatedAt: new Date() },
        $push: {
          credit_history: {
            amount,
            note: note || 'Credits added by support',
            timestamp: new Date(),
            previous_base_credit: currentBaseCredit,
            new_base_credit: newBaseCredit,
            previous_available: currentAvailable,
            new_available: newAvailable,
            action_type: actionType,
          },
        } as any,
      };
    }

    const result = await teamsCollection.updateOne(
      { _id: teamObjectId },
      updateOperation
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to add credits' },
        { status: 500 }
      );
    }

    // Get updated team
    const updatedTeam = await teamsCollection.findOne({ _id: teamObjectId });

    // Log the credit operation
    try {
      await connectMongoose();

      // Get current support user from cookies
      const cookieStore = await cookies();
      const userEmail = cookieStore.get('support_user_email')?.value || 'unknown@support.local';

      // Try to find the support user
      let supportUser;
      try {
        supportUser = await User.findOne({ email: userEmail }).lean();
      } catch (err) {
        console.warn('Could not fetch support user for logging:', err);
      }

      await CreditLog.create({
        support_user_id: supportUser?._id || new ObjectId(),
        support_user_email: userEmail,
        team_id: teamObjectId,
        team_name: team.name,
        action_type: actionType,
        amount,
        previous_balance: currentAvailable,
        new_balance: newAvailable,
        reason: note || `Credits ${actionType === 'refund' ? 'refunded (credits_used decreased)' : 'added (base_credit increased)'} by support`,
        created_at: new Date(),
      });
    } catch (logError) {
      console.error('Failed to log credit operation:', logError);
      // Don't fail the request if logging fails
    }

    const actionMessage = actionType === 'refund'
      ? `Successfully refunded ${amount} credits to ${team.name} (decreased credits_used)`
      : `Successfully added ${amount} credits to ${team.name} (increased base_credit)`;

    return NextResponse.json({
      success: true,
      message: actionMessage,
      team: {
        _id: updatedTeam?._id,
        name: updatedTeam?.name,
        base_credit: updatedTeam?.base_credit,
        credits_used: updatedTeam?.credits_used,
        available_credits: (updatedTeam?.base_credit || 0) - (updatedTeam?.credits_used || 0),
      },
    });
  } catch (error) {
    console.error('Add credits error:', error);
    return NextResponse.json(
      { error: 'Failed to add credits', details: (error as Error).message },
      { status: 500 }
    );
  }
}
