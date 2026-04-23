import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:{ type: String, required: true, select: false },
  role:    { type: String, enum: ['manufacturer', 'buyer', 'admin'], required: true },
  company: { type: String, trim: true },
  avatar:  { type: String },
  location:{ type: String },
  phone:   { type: String },

  // Manufacturer-specific status (pending admin approval)
  manufacturerStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: function() { return this.role === 'manufacturer' ? 'pending' : undefined; }
  },

  // Account status
  isActive:    { type: Boolean, default: true },
  lastLogin:   { type: Date },
  loginCount:  { type: Number, default: 0 },
  mustResetPassword: { type: Boolean, default: false },
  loginHistory: [{
    ip: String,
    browser: String,
    timestamp: { type: Date, default: Date.now }
  }],

  // Buyer verification
  isVerified:  { type: Boolean, default: false },
  gstVerified: { type: Boolean, default: false },

  // Address Book
  addresses: [{
    fullName: { type: String, required: true },
    companyName: { type: String },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false }
  }],

  // Multi-language support
  language: { 
    type: String, 
    enum: ['en', 'hi', 'te', 'ta', 'kn'], 
    default: 'en' 
  },
  languagePreferenceSet: { 
    type: Boolean, 
    default: false 
  },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never return password in toJSON
userSchema.set('toJSON', {
  transform: (_doc, ret) => { delete ret.password; return ret; }
});

export default mongoose.model('User', userSchema);
