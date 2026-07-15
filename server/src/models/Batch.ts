import mongoose, { Schema, Document } from 'mongoose';

export interface IClusterPoint {
  filename: string;
  clusterId: number;
  x: number;
  y: number;
}

export interface IBatch extends Document {
  status: 'processing' | 'done' | 'error';
  files: string[];
  clusters: IClusterPoint[];
  silhouetteScore: number | null;
  errorMessage?: string;
  createdAt: Date;
}

const ClusterPointSchema: Schema = new Schema({
  filename: { type: String, required: true },
  clusterId: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
}, { _id: false });

const BatchSchema: Schema = new Schema({
  status: { type: String, enum: ['processing', 'done', 'error'], default: 'processing' },
  files: [{ type: String }],
  clusters: [ClusterPointSchema],
  silhouetteScore: { type: Number, default: null },
  errorMessage: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IBatch>('Batch', BatchSchema);
