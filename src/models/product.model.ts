import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  client_product_reference_id: {
    type: String,
    required: true,
  },
  product_name: {
    type: String,
    required: true,
  },
  product_category: {
    type: String,
    required: true,
  },
  product_hsn_code: {
    type: String,
    required: true,
  },
  product_quantity: {
    type: String,
    required: true,
  },
  product_invoice_value: {
    type: String,
    required: true,
  },
  product_gst_tax_rate: {
    type: String,
    required: true,
  },
  product_taxable_value: {
    type: String,
    required: true,
  },
  product_sgst_amount: {
    type: String,
    required: true,
  },
  product_sgst_tax_rate: {
    type: String,
    required: true,
  },
  product_cgst_amount: {
    type: String,
    required: true,
  },
  product_cgst_tax_rate: {
    type: String,
    required: true,
  },
});

const ProductModel = mongoose.model("Products", ProductSchema);
export default ProductModel;
