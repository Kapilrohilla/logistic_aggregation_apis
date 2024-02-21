import type { Response, NextFunction } from "express";
import type { ExtendedRequest } from "../utils/middleware";
import HubModel from "../models/hub.model";
import { isValidObjectId } from "mongoose";
import axios from "axios";
import config from "../utils/config";
import APIs from "../utils/constants/third_party_apis";
import EnvModel from "../models/env.model";

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

  let { name, city, pincode, state, address1, address2, phone } = req.body;
  pincode = Number(pincode);
  phone = Number(phone);
  if (
    !(
      typeof name === "string" &&
      typeof city === "string" &&
      typeof pincode === "number" &&
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
  const env = await EnvModel.findOne({}).lean();
  if (!env) {
    return res.status(500).send({
      valid: false,
      message: "Smartship ENVs not found",
    });
  }
  const smartshipToken = env.token_type + " " + env.access_token;

  const smartshipAPIconfig = { headers: { Authorization: smartshipToken } };
  const smartshipApiBody = {
    hub_details: {
      hub_name: name,
      pincode: pincode,
      city: city,
      state: state,
      address1: address1,
      address2: address2,
      hub_phone: phone,
      delivery_type_id: 2,
    },
  };

  let smartShipResponse;
  try {
    smartShipResponse = await axios.post(
      config.SMART_SHIP_API_BASEURL! + APIs.HUB_REGISTRATION,
      smartshipApiBody,
      smartshipAPIconfig
    );
  } catch (err) {
    return next(err);
  }
  const smartShipData: SMARTSHIP_DATA = smartShipResponse.data;
  console.log(JSON.stringify(smartShipData));
  let hubId = 0; // if hub_id is not available in smartShipData
  if (smartShipData.status && smartShipData.data.hub_id) {
    hubId = smartShipData.data.hub_id;
  }
  if (!smartShipData) return res.sendStatus(500);

  // // after success
  // const isSuccess = false;

  // const code = 200;
  // const message = "success";
  // const hub_id = 1234523;
  // TODO make it dynamic also above in smartship api hit
  const delivery_type_id = 2;

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
      hub_id: hubId,
      delivery_type_id,
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

export const getSpecificHub = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  const sellerId = req.seller._id;
  const hubId: string = req.params.id;
  if (!isValidObjectId(sellerId)) {
    return res.status(200).send({
      valid: false,
      message: "invalid sellerId",
    });
  }
  if (!isValidObjectId(hubId)) {
    return res.status(200).send({
      valid: false,
      message: "invalid hubId",
    });
  }

  let specificHub;
  try {
    specificHub = await HubModel.findOne({ sellerId, _id: hubId }).lean();
  } catch (err) {
    return next(err);
  }
  if (specificHub === null) {
    return res.status(200).send({
      valid: false,
      message: "Hub not found",
    });
  } else {
    return res.status(200).send({
      valid: true,
      hub: specificHub,
    });
  }
};

type SMARTSHIP_DATA = {
  status: number;
  code: number;
  message: "success" | "OK";
  data: {
    info: string;
    hub_id?: number;
    validation_error?: string[];
  };
  extra: null;
};
