import { Request, Response, NextFunction } from "express";
import type { ExtendedRequest } from "../utils/middleware";
import OrderModel from "../models/order.model";
import ProductModel from "../models/product.model";

// currently as per B2C
export const createOrder = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  const body = req.body;
  const { isB2C } = body;
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

  const isAlreadyExists = (await OrderModel.findOne({ order_refernce_id: body?.order_refernce_id }).lean()) !== null;
  console.log(isAlreadyExists);
  if (isAlreadyExists) {
    return res.status(200).send({
      valid: true,
      message: `order exists with ${body?.order_refernce_id} order_reference_id`,
    });
  }
  // product validation and saving to end here...
  const order2save = new OrderModel({
    ...body,
    isB2C: true,
    sellerId: req.seller._id,
    productId: savedProduct._id,
  });

  let savedOrder;
  try {
    const order = new OrderModel(order2save);
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
    orders = await OrderModel.find({ sellerId }).limit(limit).skip(skip).populate("productId");
    orderCount = await OrderModel.countDocuments();
  } catch (err) {
    return next(err);
  }
  return res.status(200).send({
    valid: true,
    response: { orders, orderCount },
  });
};

// export const getOrders = (req: ExtendedRequest, res: Response, next: NextFunction) => {
//   console.log(req.seller);
//   return res.status(200).send({
//     valid: false,
//     message: "Incomplete route",
//   });
// };
