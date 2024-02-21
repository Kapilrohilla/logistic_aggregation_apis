import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  wallerBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  margin: {
    type: Number,
    min: 0,
    max: 100,
    default: 20,
  },
  vendors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendors",
    },
  ],
  codPrice: {
    type: Number,
    min: 0,
    default: 40,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});

const SellerModel = mongoose.model("Seller", sellerSchema);

export default SellerModel;
