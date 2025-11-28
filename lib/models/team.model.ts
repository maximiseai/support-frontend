import { Schema, model, models, Model } from 'mongoose';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

export const TeamType = {
  USER: 'user',
  ADMIN: 'admin',
  INTERNAL: 'internal',
  BETA: 'beta',
} as const;

export interface ITeamMember {
  uid: string;
  email: string;
  active: boolean;
  role: string;
  name?: string;
}

export interface IBaseCredits {
  phonefinder: number;
  emailfinder: number;
  linkedinfinder: number;
  reverselookup: number;
  companylookup: number;
  emailverification: number;
}

export interface ITeam {
  uid: string;
  name: string;
  base_credit: number;
  credits_used: number;
  base_credits: IBaseCredits;
  credits_consumed: IBaseCredits;
  daily_followers_scraped: number;
  last_followers_reset: Date;
  credit_cycles: any[];
  members: ITeamMember[];
  subscriptions: any[];
  add_ons: any[];
  apiKey: string | null;
  apiKeyRotationId: string | null;
  currentPlan: any;
  notifications: number;
  team_type: 'user' | 'admin' | 'internal' | 'beta';
  payment_customer_ref: string | null;
  default_payment_method: string | null;
  referrer: string | null;
  onboarding_complete: boolean;
  onboarding_metadata: {
    referrer: string | null;
    organisation: string | null;
  };
  auto_topup_enabled: boolean;
  auto_topup_config: {
    drops_below: number;
    add_credits: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

interface ITeamMethods {
  generateApiKey(): string;
  transform(): any;
}

interface ITeamModel extends Model<ITeam, {}, ITeamMethods> {}

const teamSchema = new Schema<ITeam, ITeamModel, ITeamMethods>(
  {
    uid: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      maxlength: 128,
      trim: true,
    },
    base_credit: {
      type: Number,
      default: 10,
    },
    credits_used: {
      type: Number,
      default: 0,
    },
    base_credits: {
      type: Schema.Types.Mixed,
      default: {
        phonefinder: 0,
        emailfinder: 0,
        linkedinfinder: 0,
        reverselookup: 0,
        companylookup: 0,
        emailverification: 0,
      },
    },
    credits_consumed: {
      type: Schema.Types.Mixed,
      default: {
        phonefinder: 0,
        emailfinder: 0,
        linkedinfinder: 0,
        reverselookup: 0,
        companylookup: 0,
        emailverification: 0,
      },
    },
    daily_followers_scraped: {
      type: Number,
      default: 0,
    },
    last_followers_reset: {
      type: Date,
      default: Date.now,
    },
    credit_cycles: {
      type: [] as any,
      default: [],
    },
    members: {
      type: [] as any,
      required: true,
      default: [],
    },
    subscriptions: {
      type: [] as any,
      default: [],
    },
    add_ons: {
      type: [] as any,
      default: [],
    },
    apiKey: {
      type: String,
      default: null,
    },
    apiKeyRotationId: {
      type: String,
      default: null,
    },
    currentPlan: {
      type: Schema.Types.Mixed,
      default: null,
    },
    notifications: {
      type: Number,
      default: 0,
    },
    team_type: {
      type: String,
      enum: Object.values(TeamType),
      default: TeamType.USER,
    },
    payment_customer_ref: {
      type: String,
      default: null,
    },
    default_payment_method: {
      type: String,
      default: null,
    },
    referrer: {
      type: String,
      default: null,
    },
    onboarding_complete: {
      type: Boolean,
      default: false,
    },
    onboarding_metadata: {
      type: Schema.Types.Mixed,
      default: {
        referrer: null,
        organisation: null,
      },
    },
    auto_topup_enabled: {
      type: Boolean,
      default: false,
    },
    auto_topup_config: {
      type: Schema.Types.Mixed,
      default: {
        drops_below: 0,
        add_credits: 0,
      },
    },
  },
  { timestamps: true }
);

teamSchema.pre('save', async function save(next) {
  try {
    if (!this.uid || this.uid === '') {
      this.uid = uuidv4();
    }
    return next();
  } catch (error: any) {
    return next(error);
  }
});

teamSchema.methods.generateApiKey = function () {
  const rotationId = uuidv4();
  this.apiKeyRotationId = rotationId;
  const payload = {
    id: this._id,
    type: 'api',
    rotation: rotationId,
  };
  return jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
  });
};

teamSchema.methods.transform = function () {
  const transformed: any = {};
  const fields = [
    'uid',
    'name',
    'base_credit',
    'credits_used',
    'base_credits',
    'credits_consumed',
    'subscriptions',
    'add_ons',
    'members',
    'apiKey',
    'createdAt',
    'signals_unlocked',
    'notifications',
    'credit_cycle',
    'team_type',
    'payment_customer_ref',
    'default_payment_method',
    'referrer',
    'onboarding_complete',
    'onboarding_metadata',
    'auto_topup_enabled',
    'auto_topup_config',
  ];

  fields.forEach((field) => {
    if (field === 'subscriptions') {
      transformed[field] = (this as any)[field].map((subscription: any) => ({
        ref: subscription.ref,
        created: subscription.created,
        status: subscription.status,
        items:
          subscription.items && subscription.items.data
            ? subscription.items.data.map((item: any) => ({
                data: [
                  {
                    price: {
                      unit_amount: item.price.unit_amount,
                    },
                  },
                ],
              }))
            : null,
        line_items:
          subscription.line_items && subscription.line_items.data
            ? subscription.line_items.data.map((item: any) => ({
                data: [
                  {
                    price: {
                      unit_amount: item.price.unit_amount,
                    },
                  },
                ],
              }))
            : null,
        invoice: subscription.invoice
          ? {
              invoice_pdf: subscription.invoice.invoice_pdf,
            }
          : null,
      }));
    } else {
      transformed[field] = (this as any)[field];
    }
  });

  return transformed;
};

const Team = (models.team || model<ITeam, ITeamModel>('team', teamSchema)) as ITeamModel;

export default Team;
