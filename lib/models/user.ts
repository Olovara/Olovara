import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  profileImage?: string;
  stripeConnectedLinked: boolean;
  isEmailVerified: boolean;
  userBio: string;
  products: mongoose.Types.ObjectId[];
  role: 'user' | 'seller' | 'admin';
  shopName?: string;
  totalSales: number;
  verificationToken?: string;
  verificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    id: {
      type: String,
      unique: true,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
    },
    stripeConnectedLinked: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    userBio: {
      type: String,
      default: "",
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    role: {
      type: String,
      enum: ["user", "seller", "admin"], // Define the possible roles
      default: "user", // Set a default role
      required: true,
    },
    // Optional fields for sellers
    shopName: {
      type: String,
      unique: true,
      sparse: true, // Allows this to be unique even if some records don't have it
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    // Fields for email verification and password reset
    verificationToken: {
      type: String,
    },
    verificationExpires: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);