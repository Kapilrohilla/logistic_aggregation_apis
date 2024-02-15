import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  //  request info
  ip_address: {
    type: String,
    required: true,
  },
  run_type: {
    type: String,
    required: true,
  },
  browser_name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  shipment_type: {
    type: Number,
    required: true,
  },
  // order info
  client_order_refernce_id: {
    type: String,
    required: true,
  },
  order_collectable_amount: {
    type: String,
    required: true,
  },
  total_order_value: {
    type: String,
    required: true,
  },
  payment_type: {
    type: String,
    required: true,
  },
  package_order_weight: {
    type: String,
    required: true,
  },
  package_order_length: {
    type: String,
    required: true,
  },
  package_order_height: {
    type: String,
    required: true,
  },
  package_order_width: {
    type: String,
    required: true,
  },
  shipper_hub_id: {
    type: String,
    required: true,
  },
  shipper_gst_no: {
    type: String,
    required: true,
  },
  order_invoice_date: {
    type: String,
    required: true,
  },
  productDetails: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Products",
    },
  ],
});

const OrderModel = mongoose.model("Orders", OrderSchema);
export default OrderModel;
