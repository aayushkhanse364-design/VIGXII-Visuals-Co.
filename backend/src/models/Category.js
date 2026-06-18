import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Category title is required'],
      trim: true,
    },
    year: {
      type: String,
      required: [true, 'Category year is required'],
      trim: true,
    },
    coverUrl: {
      type: String,
      required: [true, 'Category cover URL is required'],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Category', categorySchema);