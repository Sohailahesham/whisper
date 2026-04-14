import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, required: true, minlength: 1, maxlength: 500 },
    answer: { type: String, default: null, maxlength: 1000 },
    answeredAt: { type: Date, default: null },
    status: { type: String, enum: ['pending', 'answered', 'ignored'], default: 'pending' },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  },
  { timestamps: true },
);

questionSchema.index({ recipient: 1, status: 1, createdAt: -1 });
questionSchema.index({ status: 1, answeredAt: -1 });

questionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const Question = mongoose.model('Question', questionSchema);
