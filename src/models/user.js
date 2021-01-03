import mongoose, { Schema } from 'mongoose';

const userSchema = Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  permissions: [
    {
      type: String,
    },
  ],
  active: Boolean,
  todaysTarget: Number,
  dashboardView: {
    type: [String],
    default: [],
  },
});

const roleSchema = Schema({
  name: {
    type: String,
    required: true,
  },
});

const persmissionSchema = Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

export const User = mongoose.model('User', userSchema);
export const Role = mongoose.model('Role', roleSchema);
export const Permission = mongoose.model('Permission', persmissionSchema);
