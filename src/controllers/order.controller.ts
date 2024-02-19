import { Request, Response, NextFunction } from "express";
import type { ExtendedRequest } from "../utils/middleware";
import { B2COrderModel, B2BOrderModel } from "../models/order.model";
import ProductModel from "../models/product.model";
import HubModel from "../models/hub.model";
// import ConsigneeModel from "customer_details../models/consignee.model";

// currently as per B2C
export const createB2COrder = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  const body = req.body;
  // "const { isB2C } = body;

  const isAlreadyExists = (await B2COrderModel.findOne({ order_refernce_id: body?.order_refernce_id }).lean()) !== null;
  if (isAlreadyExists) {
    return res.status(200).send({
      valid: true,
      message: `order exists with ${body?.order_refernce_id} order_reference_id`,
    });
  }

  if (!body?.customer_details) {
    return res.status(200).send({
      valid: false,
      message: "customer details required",
    });
  }

  // validating picup address start
  if (!body?.pickupAddress) {
    return res.status(200).send({
      valid: false,
      message: "Pickup address is required",
    });
  }
  try {
    const doesItExists = (await HubModel.findById(body?.pickupAddress)) !== null;
    if (!doesItExists) {
      return res.status(200).send({ valid: false, message: "pickup address doesn't exists as hub" });
    }
  } catch (err) {
    return next(err);
  }
  // validating picup address end

  // product validation and saving to db start here...
  if (!body?.productDetails) {
    return res.status(200).send({
      valid: false,
      message: "Product details are required",
    });
  }
  const { name, category, hsn_code, quantity } = body.productDetails;
  if (
    !(
      typeof name === "string" ||
      typeof category === "string" ||
      typeof hsn_code === "string" ||
      typeof quantity === "number"
    )
  ) {
    return res.status(200).send({
      valid: false,
      message: "Invalid payload type",
    });
  }

  const product2save = new ProductModel({
    name: name,
    category: category,
    hsn_code: hsn_code,
    quantity: quantity,
  });
  let savedProduct;

  try {
    savedProduct = await product2save.save();
  } catch (err) {
    return next(err);
  }
  const customerDetails = body?.customer_details;
  if (
    !(
      customerDetails.name &&
      customerDetails.email &&
      customerDetails.phone &&
      customerDetails.address &&
      customerDetails.pincode
    )
  ) {
    return res.status(200).send({
      valid: false,
      message: "customer details are required",
    });
  }
  // product validation and saving to end here...

  const order2save = new B2COrderModel({
    ...body,
    isB2C: true,
    sellerId: req.seller._id,
    productId: savedProduct._id,
    pickupAddress: body?.pickupAddress,
    b2C_consigneeDetails: {
      name: customerDetails.name,
      email: customerDetails.email,
      phone: customerDetails.phone,
      address: customerDetails.address,
      pincode: customerDetails.pincode,
    },
  });

  let savedOrder;
  try {
    const order = new B2COrderModel(order2save);
    savedOrder = await (await order.save()).populate("productId");
  } catch (err) {
    return next(err);
  }

  return res.status(200).json({
    valid: true,
    order: savedOrder,
  });
};

export const getOrders = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  const sellerId = req.seller._id;
  let { limit = 10, page = 1 } = req.query;
  limit = Number(limit);
  page = Number(page);
  page = page < 1 ? 1 : page;
  limit = limit < 1 ? 1 : limit;

  const skip = --page * limit;
  console.log(skip);
  let orders, orderCount;
  try {
    orders = await B2COrderModel.find({ sellerId }).limit(limit).skip(skip).populate("productId");
    orderCount = await B2COrderModel.countDocuments();
  } catch (err) {
    return next(err);
  }
  return res.status(200).send({
    valid: true,
    response: { orders, orderCount },
  });
};

export const createB2BOrder = async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body;

  // checking if the order already exists with same "client_reference_order_id"
  const isAlreadyExists =
    (await B2BOrderModel.findOne({ client_reference_order_id: body?.client_reference_order_id }).lean()) !== null;

  if (isAlreadyExists) {
    return res.status(200).send({
      valid: false,
      message: `Order already exists with client_reference_order_id: ${body?.client_reference_order_id} `,
    });
  }

  // validating pickup address

  if (!body?.pickupAddress) {
    return res.status(200).send({
      valid: false,
      message: "Pickup address is required",
    });
  }
  try {
    const doesItExists = (await HubModel.findById(body?.pickupAddress)) !== null;
    if (!doesItExists) {
      return res.status(200).send({ valid: false, message: "pickup address doesn't exists as hub" });
    }
  } catch (err) {
    return next(err);
  }

  // validating pickup address end

  const order2save = new B2BOrderModel(body);
  let savedOrder;
  try {
    savedOrder = await order2save.save();

    return res.status(200).send({
      valid: false,
      message: "order created successfully",
      savedOrder,
    });
  } catch (err) {
    return next(err);
  }

  return res.status(200).json({ valid: true, order: savedOrder });
};
