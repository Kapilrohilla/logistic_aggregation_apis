import axios from "axios";
import config from "./config";
import EnvModel from "../models/env.model";
import type { NextFunction, Request, Response } from "express";
import VendorModel from "../models/vendor.model";
import PincodeModel from "../models/pincode.model";

export const validateEmail = (email: string) => {
  return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)*[a-zA-Z]{2,}))$/.test(
    email
  );
};

export const connectSmartShip = () => {
  const requestBody = {
    username: config.SMART_SHIP_USERNAME,
    password: config.SMART_SHIP_PASSWORD,
    client_id: config.SMART_SHIP_CLIENT_ID,
    client_secret: config.SMART_SHIP_CLIENT_SECRET,
    grant_type: config.SMART_SHIP_GRANT_TYPE,
  };

  axios
    .post("https://oauth.smartship.in/loginToken.php", requestBody)
    .then((r) => {
      console.log("SmartShip API response: " + r.data);
      const responseBody = r.data;
      const savedEnv = new EnvModel(responseBody);
      EnvModel.deleteMany({})
        .then(() => {
          savedEnv
            .save()
            .then((r) => {
              console.log("Environment varibale Document updated successfully");
            })
            .catch((err) => {
              console.log("Error: while adding environment variable to ENV Document");
              console.log(err);
            });
        })
        .catch((err) => {
          console.log("Failed to clean up environment variables Document");
          console.log(err);
        });
    })
    .catch((err) => {
      console.log("SmartShip API Error Response: ");
      console.error(err?.response?.data);
    });
};

export const addVendors = async (req: Request, res: Response, next: NextFunction) => {
  const vendor = new VendorModel(req.body);
  let savedVendor;
  try {
    savedVendor = await vendor.save();
  } catch (err) {
    return next(err);
  }
  return res.status(200).send({
    valid: true,
    vendor: savedVendor,
  });
};

// condition timing should be in the format: "hour:minute:second"
export const getNextDateWithDesiredTiming = (timing: string): Date => {
  const currentDate = new Date();
  const hour = Number(timing.split(":")[0]);
  const minute = Number(timing.split(":")[1]);
  const second = Number(timing.split(":")[2]);
  currentDate.setHours(hour, minute, second, 0);
  currentDate.setDate(currentDate.getDate() + 1);
  return currentDate;
};

export const getPincodeDetails = async (Pincode: number) => {
  const picodeDetails = await PincodeModel.findOne({ Pincode }).lean();
  return picodeDetails;
};

export const MetroCitys = ["Delhi", "Mumbai", "Kolkata", "Hyderabad", "Chennai", "Bangalore", "Ahmedabad"];
export const NorthEastStates = ["Arunachal Pradesh", "Assam", "Manipur", "Meghalya", "Mizoram", "Nagaland", "Tripura"];
