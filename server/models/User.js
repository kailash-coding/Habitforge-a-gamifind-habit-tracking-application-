const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, default: '' },
    passwordHash: { type: String, default: null },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.virtual('id').get(function () {
  return this._id.toString();
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
