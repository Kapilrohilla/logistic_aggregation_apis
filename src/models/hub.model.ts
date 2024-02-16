import mongoose from "mongoose";

const HubSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.ObjectId, ref: "Seller", required: true },

  //  "hub_details":{
  name: { type: String, required: true },
  pincode: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  address1: { type: String, required: true },
  address2: { type: String, required: true },
  phone: { type: Number, required: true },
  delivery_type_id: { type: Number, required: true },

  isSuccess: { type: Boolean, required: true },
  code: { type: Number, required: true },
  message: { type: String, required: true },
  hub_id: { type: Number, required: true },
});

const HubModel = mongoose.model("Hub", HubSchema);
export default HubModel;
