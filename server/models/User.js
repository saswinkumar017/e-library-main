const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const borrowedBookSchema = new mongoose.Schema(
  {
    bookId: mongoose.Schema.Types.ObjectId,
    bookTitle: String,
    bookCategory: {
      type: String,
      enum: ['offline', 'online'],
      default: 'offline'
    },
    googleDriveLink: String,
    borrowDate: Date,
    dueDate: Date,
    lastRenewedAt: Date,
    returnDate: Date,
    status: {
      type: String,
      enum: ['borrowed', 'pending_admin_verification', 'returned', 'expired'],
      default: 'borrowed'
    },
    isReturned: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  profilePicture: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  borrowedBooks: [borrowedBookSchema],
  totalPrintoutSpent: {
    type: Number,
    default: 0
  },
  totalPrintoutsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
