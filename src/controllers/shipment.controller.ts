import type { Request, Response, NextFunction } from "express";
import { isValidPayload } from "../utils/helpers";
import { B2COrderModel } from "../models/order.model";
import { isValidObjectId } from "mongoose";
import axios from "axios";
import config from "../utils/config";
import APIs from "../utils/constants/third_party_apis";
import EnvModel from "../models/env.model";
import type { ExtendedRequest } from "../utils/middleware";
import ProductModel from "../models/product.model";
import ShipmentResponseModel from "../models/shipment-response.model";
import VendorModel from "../models/vendor.model";

// orderType = 0 ? "b2c" : "b2b"
export async function createShipment(req: ExtendedRequest, res: Response, next: NextFunction) {
  const body = req.body;

  if (req.seller?.gstno) return res.status(200).send({ valid: false, message: "Invalid seller gst number " });

  if (!(isValidPayload(body, ["orderId", "orderType"]) && isValidObjectId(body.orderId)))
    return res.status(200).send({ valid: false, message: "Invalid payload" });

  if (!isValidObjectId(body.orderId)) return res.status(200).send({ valid: false, message: "Invalid payload" });

  let { orderId, orderType, carrierId } = req.body;
  if (!carrierId) {
    return res.status(200).send({ valid: false, message: "carrier id required" });
  }
  carrierId = Number(carrierId);
  const vendorWithCarrierId = await VendorModel.findOne({ smartship_carrier_id: carrierId }).lean();
  if (!vendorWithCarrierId) {
    return res.status(200).send({ valid: false, message: "Invalid carrier" });
  }
  let order;
  if (Number(orderType) === 0) {
    try {
      order = await B2COrderModel.findById(orderId).populate("pickupAddress");
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
    return res.status(200).send({ valid: false, message: "invalid order type" });
  }
  if (!order) return res.status(200).send({ valid: false, message: "Order not found" });
  console.log(order?.productId);
  const productDetails = await ProductModel.findById(order?.productId);

  console.log(productDetails);

  if (productDetails === null) return res.status(200).send({ valid: false, message: "Product details not found" });

  const env = await EnvModel.findOne({}).lean();
  if (!env) return res.status(500).send({ valid: false, message: "Smartship ENVs not found" });
  const smartshipToken = env.token_type + " " + env.access_token;

  let {
    order_refernce_id,
    paymentMode,
    shipmentValue,
    productTaxRate,
    weightUnit,
    boxWeight,
    numberOfBox,
    sizeUnit,
    boxLength,
    boxHeight,
    boxWidth,
    invoiceDate,
    invoiceNumber,
    customerDetails,
    amountToCollect,
  } = order;
  const { pickupAddress } = order;

  const orderTotalValue = shipmentValue + shipmentValue * (productTaxRate / 100);
  //@ts-ignore
  const hubId = pickupAddress?.hub_id;
  console.log("shipment");
  console.log(shipmentValue);
  console.log("shipment");

  boxWeight = Number(boxWeight);
  boxLength = Number(boxLength);
  boxHeight = Number(boxHeight);
  boxWidth = Number(boxWeight);

  let orderWeight = boxWeight;
  if (weightUnit === "kg") boxWeight = boxWeight * 1000;
  orderWeight *= Number(numberOfBox);
  if (sizeUnit === "m") {
    boxWidth = boxWeight * 100;
    boxHeight = boxWeight * 100;
    boxLength = boxLength * 100;
  }

  const productTaxableValue = (order.productTaxRate / 100) * order.shipmentValue;

  const shipmentAPIBody = {
    request_info: {
      run_type: "validate",
      shipment_type: 1, // 1 => forward, 2 => return order
    },
    orders: [
      {
        client_order_reference_id: order_refernce_id,
        order_collectable_amount: amountToCollect, // need to take  from user in future
        total_order_value: orderTotalValue,
        payment_type: paymentMode ? "cod" : "prepaid",
        // package_order_weight: orderWeight,
        // package_order_length: boxLength,
        // package_order_height: boxHeight,
        package_order_weight: 1.5,
        package_order_length: 10,
        package_order_width: 10,
        package_order_height: 20,
        shipper_hub_id: hubId,
        shipper_gst_no: req.seller.gstno,
        order_invoice_date: invoiceDate, // not mandatory
        order_invoice_number: invoiceNumber, // not mandatory
        order_meta: {
          // not mandatory
          preferred_carriers: [carrierId],
        },
        product_details: [
          {
            client_product_reference_id: "123", // not mandantory
            // @ts-ignore
            product_name: productDetails.name,
            // @ts-ignore
            product_category: productDetails.category,
            product_hsn_code: productDetails?.hsn_code, // appear to be mandantory
            product_quantity: productDetails?.quantity,
            product_invoice_value: orderTotalValue, //productDetails?.invoice_value, // invoice value
            product_taxable_value: shipmentValue,
            product_gst_tax_rate: 18,
            product_sgst_amount: 0,
            product_sgst_tax_rate: 0,
            product_cgst_amount: 0,
            product_cgst_tax_rate: 0,
          },
        ],
        consignee_details: {
          consignee_name: customerDetails.get("name"),
          consignee_phone: customerDetails?.get("phone"),
          consignee_email: customerDetails.get("email"),
          consignee_complete_address: customerDetails.get("address"),
          consignee_pincode: customerDetails.get("pincode"),
        },
      },
    ],
  };
  // return res.sendStatus(500);
  const shipmentAPIConfig = { headers: { Authorization: smartshipToken } };
  // /*
  console.log("shipment api body");
  console.log(JSON.stringify(shipmentAPIBody));
  console.log("shipment api body");
  try {
    const response = await axios.post(
      config.SMART_SHIP_API_BASEURL + APIs.CREATE_SHIPMENT,
      shipmentAPIBody,
      shipmentAPIConfig
    );

    const responseData = response.data;
    console.log(JSON.stringify(responseData));
    if (!responseData?.data?.total_success_orders) {
      return res.status(200).send({ valid: false, message: "order failed to create" });
    }

    const shipemntResponseToSave = new ShipmentResponseModel({ order: orderId, responseData });
    try {
      await shipemntResponseToSave.save();
      let updatedOrder;
      try {
        updatedOrder = await B2COrderModel.findByIdAndUpdate(order._id, { orderStage: 1 }, { new: true });
      } catch (err) {
        return next(err);
      }

      return res.status(200).send({
        valid: true,
        message: "Shipment created successfully",
        resposne: response.data,
        savedDocument: shipemntResponseToSave,
        updatedOrder,
      });
    } catch (err) {
      console.log("failed to save shipment response");
      console.log(err);
      return next(err);
    }
  } catch (err) {
    return next(err);
  }
  return res.status(500).send({ valid: false, message: "incomplete route", order: order });
}

export async function cancelShipment(req: ExtendedRequest, res: Response, next: NextFunction) {
  const body = req.body;

  const { orderReferenceId } = body;

  if (orderReferenceId) {
    return res.status(200).send({ valid: false, message: "invalid payload" });
  }
  const order = await B2COrderModel.findOne({
    order_refernce_id: orderReferenceId,
    orderStage: 1,
    sellerId: req.seller._id,
  }).lean();

  if (!order)
    return res.status(200).send({ valid: false, message: `No active shipment found with #${orderReferenceId}` });

  const env = await EnvModel.findOne({}).lean();
  if (!env) return res.status(500).send({ valid: false, message: "Smartship ENVs not found" });
  const smartshipToken = env.token_type + " " + env.access_token;

  const shipmentAPIConfig = { headers: { Authorization: smartshipToken } };
  const requestBody = { client_order_reference_ids: [orderReferenceId] };
  /*
  const response = await axios.post(
    config.SMART_SHIP_API_BASEURL + APIs.CANCEL_SHIPMENT,
    requestBody,
    shipmentAPIConfig
  );
  console.log(JSON.stringify(response));
    */

  return res.status(500).send({ valid: false, message: "incomplete route" });
}

export async function trackShipment(req: ExtendedRequest, res: Response, next: NextFunction) {
  const body = req.body;

  const { orderReferenceId } = body;

  if (!orderReferenceId) return res.status(200).send({ valid: false, message: "orderReferenceId required" });

  const orderWithOrderReferenceId = await B2COrderModel.find({ order_refernce_id: orderReferenceId }).lean();

  if (!orderWithOrderReferenceId) {
    return res.status(200).send({ valid: false, message: "order doesn't exists" });
  }
  const env = await EnvModel.findOne({}).lean();
  if (!env) return res.status(200).send({ valid: false, message: "Smartship ENVs not found" });

  const smartshipToken = env.token_type + " " + env.access_token;
  const shipmentAPIConfig = { headers: { Authorization: smartshipToken } };
  return res.status(500).send({ valid: false, message: "Incomplete route" });
}
