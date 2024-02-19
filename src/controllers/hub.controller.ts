import { Response, NextFunction } from "express";
import type { ExtendedRequest } from "../utils/middleware";
import HubModel from "../models/hub.model";

export const createHub = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  const body = req.body;

  if (!body) {
    return res.status(200).send({
      valid: false,
      message: "payload required",
    });
  }

  if (!(body?.name && body?.city && body?.pincode && body?.state && body?.address1 && body?.address2 && body?.phone)) {
    return res.status(200).send({
      valid: false,
      message: "Invalid payload",
    });
  }

  const { name, city, pincode, state, address1, address2, phone } = req.body;
  if (
    !(
      typeof name === "string" &&
      typeof city === "string" &&
      typeof pincode === "string" &&
      typeof state === "string" &&
      typeof address1 === "string" &&
      typeof address2 === "string" &&
      typeof phone === "number"
    )
  ) {
    return res.status(200).send({
      valid: false,
      message: "invalid payload type",
    });
  }

  const isAlreadyExists = (await HubModel.findOne({ name, sellerId: req.seller._id }).lean()) !== null;
  // create hub using smartship api
  if (isAlreadyExists) {
    return res.status(200).send({
      valid: false,
      message: `Hub already exists with name: ${name}`,
    });
  }

  // // after success
  // const isSuccess = false;

  // const code = 200;
  // const message = "success";
  // const hub_id = 1234523;
  // const delivery_type_id = 1;

  let savedHub;
  try {
    const toSaveHub = new HubModel({
      sellerId: req.seller._id,
      name,
      city,
      pincode,
      state,
      address1,
      address2,
      phone,

      // isSuccess,
      // code,
      // message,
      // hub_id,
      // delivery_type_id,
    });
    savedHub = await toSaveHub.save();
  } catch (err) {
    return next(err);
  }

  return res.status(200).send({
    valid: true,
    hub: savedHub,
  });
};

export const getHub = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  const sellerId = req.seller._id;

  let sellerHubs;
  try {
    sellerHubs = await HubModel.find({ sellerId });
  } catch (err) {
    return next(err);
  }
  return res.status(200).send({
    valid: true,
    hubs: sellerHubs,
  });
};
