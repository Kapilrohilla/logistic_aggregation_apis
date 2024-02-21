import type { Request, Response, NextFunction } from "express";
import { isValidPayload } from "../utils/helpers";
import { B2COrderModel } from "../models/order.model";
import { isValidObjectId } from "mongoose";

// orderType = 0 ? "b2c" : "b2b"
export async function createShipment(req: Request, res: Response, next: NextFunction) {
  const body = req.body;

  if (!(isValidPayload(body, ["orderId", "orderType"]) && isValidObjectId(body.orderId))) {
    return res.status(200).send({
      valid: false,
      message: "Invalid payload",
    });
  }

  if (!isValidObjectId(body.orderId)) {
    return res.status(200).send({
      valid: false,
      message: "Invalid payload",
    });
  }

  const { orderId, orderType } = req.body;
  let order;
  if (Number(orderType) === 0) {
    try {
      order = await B2COrderModel.findById(orderId);
    } catch (err) {
      return next(err);
    }
  } else if (Number(orderType) === 1) {
    try {
      order = await B2COrderModel.findById(orderId);
    } catch (err) {
      return next(err);
    }
  } else {
    return res.status(200).send({
      valid: false,
      message: "invalid order type",
    });
  }
  return res.status(500).send({
    message: "incomplete route",
  });
}
