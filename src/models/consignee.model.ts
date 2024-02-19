import mongoose from "mongoose";

const consigneeModel = new mongoose.Schema({
  order_refernce_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Orders",
  },
  consignee_name: {
    type: String,
    required: true,
  },
  consignee_phone: {
    type: String,
    required: true,
  },
  consignee_email: {
    type: String,
    required: true,
  },
  consignee_complete_address: {
    type: String,
    required: true,
  },
  consignee_pincode: {
    type: String,
    required: true,
  },
});

const ConsigneeModel = mongoose.model("Consignee", consigneeModel);
export default ConsigneeModel;
