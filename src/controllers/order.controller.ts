import { Request, Response, NextFunction, query } from "express";
import type { ExtendedRequest } from "../utils/middleware";
import { B2COrderModel, B2BOrderModel } from "../models/order.model";
import ProductModel from "../models/product.model";
import HubModel from "../models/hub.model";
import VendorModel from "../models/vendor.model";
import { MetroCitys, NorthEastStates, getNextDateWithDesiredTiming, getPincodeDetails } from "../utils/helpers";
import PincodeModel from "../models/pincode.model";
// import ConsigneeModel from "customer_details../models/consignee.model";

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
      customerDetails.city &&
      customerDetails.state &&
      customerDetails.pincode
    )
  ) {
    return res.status(200).send({
      valid: false,
      message: "customer details: name, email, phone, address, city, state are required",
    });
  }
  // product validation and saving to end here...

  const order2save = new B2COrderModel({
    ...body,
    isB2C: true,
    sellerId: req.seller._id,
    productId: savedProduct._id,
    pickupAddress: body?.pickupAddress,
    customerDetails: customerDetails,
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

export const getCourier = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  const seller = req.seller;
  const productId = req.params.id;
  const type = req.params.type;

  let orderDetails: any;
  if (type === "b2c") {
    try {
      orderDetails = await B2COrderModel.findById(productId);
      if (orderDetails !== null) {
        //@ts-ignore
        orderDetails = await orderDetails.populate("pickupAddress");
      }
    } catch (err) {
      return next(err);
    }
  } else {
    try {
      orderDetails = await B2BOrderModel.findById(productId);
    } catch (err) {
      return next(err);
    }
  }

  // @ts-ignore
  const totalBoxWeight = orderDetails?.boxWeight * orderDetails?.numberOfBox;
  let orderWeight: number | null = null;
  if (orderDetails?.sizeUnit === "cm") {
    const totalVolumetricWeight = (orderDetails?.boxHeight * orderDetails?.boxWeight * orderDetails?.boxLength) / 5000;
    orderWeight = totalBoxWeight > totalVolumetricWeight ? totalBoxWeight : totalVolumetricWeight;
  } else if (orderDetails?.sizeUnit === "m") {
    const totalVolumetricWeight = (orderDetails?.boxHeight * orderDetails?.boxWeight * orderDetails?.boxLength) / 5;
    orderWeight = totalBoxWeight > totalVolumetricWeight ? totalBoxWeight : totalVolumetricWeight;
  }
  if (orderWeight === null) {
    return res.status(200).send({
      valid: false,
      message: `unhandled box size unit, sizeUnit = ${orderDetails?.sizeUnit}`,
    });
  }

  // @ts-ignore
  let pickupAddress: PickupAddress = orderDetails?.pickupAddress;
  console.log(pickupAddress);
  // @ts-ignore
  const customerDetails = orderDetails.customerDetails;

  const margin = seller.margin || 100;
  const vendors = seller.vendors;

  let vendorsDetails;
  try {
    let queryCondition = vendors.map((id: string) => {
      return { _id: id };
    });

    vendorsDetails = await VendorModel.find({ $or: queryCondition });
  } catch (err) {
    return next(err);
  }
  /*
    orderDetails, vendors
  */

  if (!vendorsDetails) {
    return res.status(200).send({
      valid: false,
      message: "Invalid vendor",
    });
  }

  const pickupPinCode = pickupAddress.pincode;
  const deliveryPincode = customerDetails.pincode;
  const pickupPinCodeDetails = await getPincodeDetails(Number(pickupPinCode));
  const deliveryPinCodeDetails = await getPincodeDetails(Number(deliveryPincode));
  if (!pickupPinCodeDetails || !deliveryPinCodeDetails) {
    return res.status(200).send({
      valid: false,
      message: "invalid pickup or delivery pincode",
    });
  }

  const data2send = vendorsDetails.reduce((acc: any[], cv) => {
    let increment_price = null;
    if (pickupPinCodeDetails.District === deliveryPinCodeDetails.District) {
      // same city
      console.log("same city");
      increment_price = cv.withinCity;
    } else if (pickupPinCodeDetails.StateName === deliveryPinCodeDetails.StateName) {
      console.log("same state");
      // same state
      increment_price = cv.withinZone;
    } else if (
      MetroCitys.find((city) => city === pickupPinCodeDetails?.District) &&
      MetroCitys.find((city) => city === deliveryPinCodeDetails?.District)
    ) {
      console.log("metro ");
      // metro citys
      increment_price = cv.withinMetro;
    } else if (
      NorthEastStates.find((state) => state === pickupPinCodeDetails?.StateName) &&
      NorthEastStates.find((state) => state === deliveryPinCodeDetails?.StateName)
    ) {
      console.log("northeast");
      // north east
      increment_price = cv.northEast;
    } else {
      // rest of india
      increment_price = cv.withinRoi;
    }
    if (!increment_price) {
      return [{ message: "invalid incrementPrice" }];
    }

    const parterPickupTime = cv.pickupTime;
    const partnerPickupHour = Number(parterPickupTime.split(":")[0]);
    const partnerPickupMinute = Number(parterPickupTime.split(":")[1]);
    const partnerPickupSecond = Number(parterPickupTime.split(":")[2]);
    const pickupTime = new Date(new Date().setHours(partnerPickupHour, partnerPickupMinute, partnerPickupSecond, 0));

    const currentTime = new Date();
    let expectedPickup: string;
    if (pickupTime < currentTime) {
      expectedPickup = "Tomorrow";
    } else {
      expectedPickup = "Today";
    }

    const minWeight = cv.weightSlab;
    //@ts-ignore
    const weightIncrementRatio = (orderWeight - minWeight) / cv.incrementWeight;
    let totalCharge = increment_price.basePrice + increment_price?.incrementPrice * weightIncrementRatio;
    totalCharge = totalCharge + (margin / 100) * totalCharge;
    const gst = (18 / 100) * totalCharge;
    totalCharge = totalCharge += gst;

    //@ts-ignore
    return acc.concat({
      name: cv.name,
      minWeight,
      charge: totalCharge,
      type: cv.type,
      expectedPickup,
      orderWeight,
      // orderDetails: {
      //   totalValue: orderDetails?.totalValue,
      //   shipmentValue: orderDetails?.shipmentValue,
      //   taxValue: orderDetails?.taxValue,
      //   orderWeight: orderWeight,
      //   pickupDetails: {
      //     name: pickupAddress?.name,
      //     pincode: pickupAddress.pincode,
      //     city: pickupAddress.city,
      //     state: pickupAddress.state,
      //     address1: pickupAddress.address1,
      //     address2: pickupAddress.address2,
      //     phone: pickupAddress.phone,
      //   },
      //   customerDetails,
      // },
    });
  }, []);

  return res.status(200).send({
    valid: true,
    courierPartner: data2send,
  });
};

type PickupAddress = {
  name: string;
  pincode: string;
  city: string;
  state: string;
  address1: string;
  address2?: string;
  phone: number;
  delivery_type_id?: number;
  isSuccess?: boolean;
  code?: number;
  message?: string;
  hub_id?: number;
};
