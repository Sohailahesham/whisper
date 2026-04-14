import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_]+$/,
      immutable: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true, minlength: 1, maxlength: 50 },
    bio: { type: String, default: '', maxlength: 200 },
    avatarUrl: { type: String, default: '' },
    acceptingQuestions: { type: Boolean, default: true },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) =>
          arr.length <= 10 && arr.every((t) => /^[a-z0-9-]{2,20}$/.test(t)),
        message: 'Invalid tags',
      },
    },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    // TODO:
    // Hint: map _id -> id, delete _id, delete passwordHash. Return ret.
    // Purpose: never leak passwordHash through res.json.
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
});

userSchema.methods.comparePassword = function (plain) {
  // TODO:
  // Hint: bcrypt.compare(plain, this.passwordHash) — returns a Promise<boolean>.
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  // TODO:
  // Hint: bcrypt.hash(plain, 10). Cost 10 is a reasonable default.
  return bcrypt.hash(plain, 10);
};

export const User = mongoose.model('User', userSchema);
