import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITeamLog extends Document {
  uid: string;
  team_uid: string;
  endpoint: string;
  ip: string;
  latency: string;
  status_code: number;
  credits_used: number;
  method: string;
  request_id: string;
  request: any;
  response: any;
  createdAt: Date;
  updatedAt: Date;
}

const teamLogSchema = new Schema<ITeamLog>(
  {
    uid: {
      type: String,
      default: '',
    },
    team_uid: {
      type: String,
      default: '',
      index: true,
    },
    endpoint: {
      type: String,
      trim: true,
    },
    ip: {
      type: String,
      default: '',
    },
    latency: {
      type: String,
      default: '',
    },
    status_code: {
      type: Number,
      default: 200,
    },
    credits_used: {
      type: Number,
      default: 0,
    },
    method: {
      type: String,
      default: 'GET',
    },
    request_id: {
      type: String,
      default: '',
    },
    request: {
      type: Schema.Types.Mixed,
      default: null,
    },
    response: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

let TeamLog: Model<ITeamLog>;

try {
  TeamLog = mongoose.model<ITeamLog>('team_log');
} catch {
  TeamLog = mongoose.model<ITeamLog>('team_log', teamLogSchema);
}

export default TeamLog;
