import mongoose, { Schema, Document } from "mongoose";

// Define possible categories and subcategories
const categories = {
  crochet: ["clothing", "plushies", "supplies"],
  knitted: ["clothing", "accessories", "supplies"],
};

// Define an interface for the product schema to strongly type `this`
interface ProductDocument extends Document {
  id: string;
  name: string;
  description: string;
  price: number;
  isDigital: boolean;
  stock?: number;
  images: string[];
  productFile?: string;
  createdBy: Schema.Types.ObjectId;
  category: keyof typeof categories; // Limit category to 'crochet' or 'knitted'
  subcategory: string;
}

const productSchema = new mongoose.Schema<ProductDocument>(
  {
    id: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isDigital: {
      type: Boolean,
      required: true,
    },
    stock: {
      type: Number,
      min: 0,
      required: function (this: ProductDocument) {
        return !this.isDigital;
      }, // Stock is required only if the product is not digital
    },
    images: {
      type: [String],
      required: true,
    },
    productFile: {
      type: String,
      required: function (this: ProductDocument) {
        return this.isDigital;
      }, // Product file is required only if the product is digital
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Reference the User model
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: Object.keys(categories), // Only allow "crochet" or "knitted"
    },
    subcategory: {
      type: String,
      required: true,
      validate: {
        validator: function (subcategory: string): boolean {
          // Properly type 'this' as 'ProductDocument'
          return categories[this.category].includes(subcategory);
        },
        message: (props: any) =>
          `${props.value} is not a valid subcategory for the selected category`,
      },
    },
  },
  { timestamps: true }
);

export const Product =
  mongoose.models.Product || mongoose.model<ProductDocument>("Product", productSchema);