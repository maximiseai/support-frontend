import { Schema, model, models, Model, Document } from 'mongoose';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

const roles = ['user', 'admin'];

interface IUser {
  uid: string;
  name: string;
  family_name: string;
  picture: string;
  email: string;
  region: string;
  company: string;
  domain: string;
  job_title: string;
  country: string;
  phone: string;
  active: boolean;
  new_user: boolean;
  subscription: any;
  usage: number;
  newUser: boolean;
  role: 'user' | 'admin';
  last_team: string;
  profile_details: any;
  company_details: any;
  metadata: any;
  has_support_dashboard_access: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IUserMethods {
  token(): string;
  transform(): any;
}

interface IUserModel extends Model<IUser, {}, IUserMethods> {}

const userSchema = new Schema<IUser, IUserModel, IUserMethods>(
  {
    uid: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: '',
      maxlength: 128,
      index: true,
      trim: true,
    },
    family_name: {
      type: String,
      default: '',
    },
    picture: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      unique: true,
      match: /^\S+@\S+\.\S+$/,
      trim: true,
      lowercase: true,
    },
    region: {
      type: String,
      default: 'wt-wt',
    },
    company: {
      type: String,
      default: 'Unknown',
    },
    domain: {
      type: String,
      default: '',
    },
    job_title: {
      type: String,
      default: 'Unknown',
    },
    country: {
      type: String,
      default: 'Unknown',
    },
    phone: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      required: true,
      default: false,
    },
    new_user: {
      type: Boolean,
      default: true,
    },
    subscription: {
      type: Schema.Types.Mixed,
      default: null,
    },
    usage: {
      type: Number,
      default: 0,
    },
    newUser: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    last_team: {
      type: String,
      default: '',
    },
    profile_details: {
      type: Schema.Types.Mixed,
      default: null,
    },
    company_details: {
      type: Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    has_support_dashboard_access: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function save(next) {
  try {
    if (!this.uid || this.uid === '') {
      this.uid = uuidv4();
    }
    return next();
  } catch (error: any) {
    return next(error);
  }
});

userSchema.methods.token = function () {
  const payload = {
    id: this._id,
  };
  return jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: 60 * 60 * 24 * 30,
  });
};

userSchema.methods.transform = function () {
  const transformed: any = {};
  const fields = [
    'uid',
    'name',
    'family_name',
    'email',
    'company',
    'job_title',
    'last_team',
    'picture',
    'country',
    'role',
    'profile_details',
    'company_details',
    'metadata',
    'createdAt',
    'phone',
    'domain',
  ];

  fields.forEach((field) => {
    transformed[field] = (this as any)[field];
  });

  return transformed;
};

const User = (models.users || model<IUser, IUserModel>('users', userSchema)) as IUserModel;

export default User;
