import { Response, NextFunction } from "express";
import type { ExtendedRequest } from "../utils/middleware";
import { isValidObjectId } from "mongoose";
import B2BCustomerModel from "../models/customer.model";

export const createCustomer = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  const sellerId = req.seller._id;
  const body = req.body;

  if (!(body?.name && body?.email && body?.phone && body?.address && body?.city && body?.state && body?.pincode)) {
    return res.status(200).send({
      valid: false,
      message: "name, email, phone, address, city, state, pincode are required",
    });
  }

  const customer2save = new B2BCustomerModel({
    sellerId,
    ...body,
  });
  console.log(customer2save);
  try {
    const customer = await customer2save.save();
    return res.status(200).send({
      valid: true,
      customer: customer,
    });
  } catch (err) {
    console.log(err);
  }
};

export const getCustomers = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  const sellerId = req.seller._id;
  console.log(req.seller);
  try {
    const b2bCustomer = await B2BCustomerModel.find({ sellerId });
    return res.status(200).send({ valid: true, customers: b2bCustomer });
  } catch (err) {
    return next(err);
  }
};
