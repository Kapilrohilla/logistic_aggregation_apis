import mongoose from "mongoose";

const B2COrderSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
  // isB2C: { type: Boolean, required: true },
  //  will require seller details / maybe hub details
  order_refernce_id: { type: String, required: true, unique: true },
  pickupAddress: { type: mongoose.Schema.Types.ObjectId, ref: "Hub" },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
  shipmentValue: { type: Number, required: true },
  taxValue: { type: Number, required: true },
  totalValue: { type: Number, required: true },
  isContainFragileItem: { type: Boolean, required: true },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: String, required: true },
  paymentMode: { type: String, required: true },
  numberOfBox: { type: Number, required: true },
  packageType: { type: String, required: true },
  boxLength: { type: Number, required: true },
  boxWidth: { type: Number, required: true },
  boxHeight: { type: Number, required: true },
  sizeUnit: { type: String, required: true },
  boxWeight: { type: Number, required: true },
  weightUnit: { type: String, required: true },
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    type: mongoose.Schema.Types.Map,
    required: true,
  },
});

// const OrderSchema = new mongoose.Schema({
//   //  request info
//   ip_address: {
//     type: String,
//     required: true,
//   },
//   run_type: {
//     type: String,
//     required: true,
//   },
//   browser_name: {
//     type: String,
//     required: true,
//   },
//   location: {
//     type: String,
//     required: true,
//   },
//   shipment_type: {
//     type: Number,
//     required: true,
//   },
//   // order info
//   client_order_refernce_id: {
//     type: String,
//     required: true,
//   },
//   order_collectable_amount: {
//     type: String,
//     required: true,
//   },
//   total_order_value: {
//     type: String,
//     required: true,
//   },
//   payment_type: {
//     type: String,
//     required: true,
//   },
//   package_order_weight: {
//     type: String,
//     required: true,
//   },
//   package_order_length: {
//     type: String,
//     required: true,
//   },
//   package_order_height: {
//     type: String,
//     required: true,
//   },
//   package_order_width: {
//     type: String,
//     required: true,
//   },
//   shipper_hub_id: {
//     type: String,
//     required: true,
//   },
//   shipper_gst_no: {
//     type: String,
//     required: true,
//   },
//   order_invoice_date: {
//     type: String,
//     required: true,
//   },
//   productDetails: [
//     {
//       type: mongoose.Schema.ObjectId,
//       ref: "Products",
//     },
//   ],
// });

const B2BOrderSchema = new mongoose.Schema({
  lrNo: { type: String, required: true },
  isManual: { type: Boolean, required: false },
  clientName: { type: String, required: true },
  paymentType: { type: String, required: true },
  pickupType: { type: String, required: true },
  insuranceType: { type: String, required: true },
  pickupLocation: { type: String, required: true },
  productDescription: { type: String, required: true },
  totalShipmentWeight: { type: String, required: true },
  client_reference_order_id: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true },
  sizeUnit: { type: String, required: true },
  dimensionsQuantity: { type: Number, required: true },
  invoiceType: { type: String, required: true },
  amount2collect: { type: String, required: true },
  ewaybill: { type: String, required: true },
  amount: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  shipperGST: { type: String, required: true },
  consigneeGST: { type: String, required: true },
  pickupAddress: { type: String, required: true },
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: false },
    state: { type: String, required: false },
    pincode: { type: String, required: true },
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
});

export const B2COrderModel = mongoose.model("B2COrders", B2COrderSchema);
export const B2BOrderModel = mongoose.model("B2BOrder", B2BOrderSchema);
