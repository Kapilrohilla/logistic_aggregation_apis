import { Request, Response, NextFunction } from "express";
import type { ExtendedRequest } from "../utils/middleware";

export const createOrder = (req: ExtendedRequest, res: Response, next: NextFunction) => {
  console.log(req.seller);

  return res.status(200).send({
    valid: false,
    message: "Incomplete route",
  });
};

export const getOrders = (req: ExtendedRequest, res: Response, next: NextFunction) => {
  console.log(req.seller);
  return res.status(200).send({
    valid: false,
    message: "Incomplete route",
  });
};
