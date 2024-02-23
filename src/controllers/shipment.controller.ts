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

// orderType = 0 ? "b2c" : "b2b"
export async function createShipment(req: ExtendedRequest, res: Response, next: NextFunction) {
  const body = req.body;

  if (req.seller?.gstno) return res.status(200).send({ valid: false, message: "Invalid seller gst number " });

  if (!(isValidPayload(body, ["orderId", "orderType"]) && isValidObjectId(body.orderId)))
    return res.status(200).send({ valid: false, message: "Invalid payload" });

  if (!isValidObjectId(body.orderId)) return res.status(200).send({ valid: false, message: "Invalid payload" });

  const { orderId, orderType } = req.body;
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

  const productDetails = await ProductModel.findById(order?.productId);

  if (productDetails === null) return res.status(200).send({ valid: false, message: "Product details not found" });

  if (!order) return res.status(200).send({ valid: false, message: "Order not found" });

  const env = await EnvModel.findOne({}).lean();
  if (!env) return res.status(500).send({ valid: false, message: "Smartship ENVs not found" });
  const smartshipToken = env.token_type + " " + env.access_token;

  let {
    order_refernce_id,
    totalValue,
    paymentMode,
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
  } = order;
  const { pickupAddress } = order;

  //@ts-ignore
  const hubId = pickupAddress?.hub_id;

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
      // {
      //   client_order_reference_id: order_refernce_id,
      //   shipment_type: 1, // 1 => forward, 2 => return order
      //   order_collectable_amount: 0, // need to take  from user in future
      //   total_order_value: totalValue,
      //   payment_type: paymentMode,
      //   package_order_weight: orderWeight,
      // },
      {
        client_order_reference_id: order_refernce_id,
        order_collectable_amount: 0, // need to take  from user in future
        total_order_value: totalValue,
        payment_type: paymentMode,
        package_order_weight: orderWeight,
        package_order_length: boxLength,
        package_order_height: boxHeight,
        package_order_width: boxWidth,
        shipper_hub_id: hubId,
        shipper_gst_no: req.seller.gstno,
        order_invoice_date: invoiceDate, // not mandatory
        order_invoice_number: invoiceNumber, // not mandatory
        order_meta: {
          // not mandatory
          preferred_carriers: [279], // TODO: replace this preferred_carriers (0) with actual values // 279 blue-dart
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
            product_invoice_value: 0, //productDetails?.invoice_value, // invoice value
            product_taxable_value: productTaxableValue,
            product_gst_tax_rate: 0,
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
  try {
    const response = await axios.post(
      config.SMART_SHIP_API_BASEURL + APIs.CREATE_SHIPMENT,
      shipmentAPIBody,
      shipmentAPIConfig
    );
    const responseData = JSON.stringify(response.data);
    console.log(responseData);
    return res.status(200).send({
      valid: true,
      message: "Shipment created successfully",
      resposne: response.data,
    });
  } catch (err) {
    return next(err);
  }
  // */

  // const tempOrderBody = {
  //   client_order_reference_id: order_refernce_id,
  //   order_collectable_amount: 0, // need to take  from user in future
  //   total_order_value: totalValue,
  //   payment_type: paymentMode,
  //   package_order_weight: orderWeight,
  //   package_order_length: boxLength,
  //   package_order_height: boxHeight,
  //   package_order_width: boxWidth,
  //   shipper_hub_id: hubId,
  //   shipper_gst_no: req.seller.gstno,
  //   order_invoice_date: invoiceDate, // not mandatory
  //   order_invoice_number: invoiceNumber, // not mandatory
  //   order_meta: {
  //     // not mandatory
  //     preferred_carriers: [279], // TODO: replace this preferred_carriers (0) with actual values // 279 blue-dart
  //   },
  //   product_details: [
  //     {
  //       client_product_reference_id: "123", // not mandantory
  //       // @ts-ignore
  //       product_name: productDetails.name,
  //       // @ts-ignore
  //       product_category: productDetails.category,
  //       product_hsn_code: productDetails?.hsn_code,
  //       product_quantity: productDetails?.quantity,
  //       product_invoice_value: productDetails?.invoice_value,
  //       product_taxable_value: productTaxableValue,
  //       product_gst_tax_rate: 0,
  //       product_sgst_amount: 0,
  //       product_sgst_tax_rate: 0,
  //       product_cgst_amount: 0,
  //       product_cgst_tax_rate: 0,
  //     },
  //   ],
  //   consignee_details: {
  //     consignee_name: customerDetails.get("name"),
  //     consignee_phone: customerDetails?.get("phone"),
  //     consignee_email: customerDetails.get("email"),
  //     consignee_complete_address: customerDetails.get("address"),
  //     consignee_pincode: customerDetails.get("pincode"),
  //   },
  // };
  // console.log(tempOrderBody);
  return res.status(500).send({ valid: false, message: "incomplete route", order: order });
}
/*
{
 "request_info":{
 "ip_address":"14.142.227.166",
 "run_type":"create",
 "browser_name":"Mozila",
 "location":"Delhi",
 "shipment_type":1
 },
 "orders":[
 {
 "client_order_reference_id":"TEST_ORDER-619",
 "order_collectable_amount":"100",
 "total_order_value":"150",
 "payment_type":"cod",
 "package_order_weight":"7400",
 "package_order_length":"10",
 "package_order_height":"10",
 "package_order_width":"20",
 "shipper_hub_id":"28329”,
 “shipper_gst_no":"",
 "order_invoice_date":"22-03-2021",
 "order_invoice_number":"invoice12",
 "order_meta":{"preferred_carriers":[1,3,279]},
  "product_details":[{
  "client_product_reference_id":"P20",
  "product_name":"Crucial 1TB SSD",
  "product_category":"computer",
  "product_hsn_code":"8471",
  "product_quantity":"2",
  "product_invoice_value":"1000",
  "product_gst_tax_rate":"1.2",
  "product_taxable_value":"100",
  "product_sgst_amount":"5",
  "product_sgst_tax_rate":"5",
  "product_cgst_amount":"5",
  "product_cgst_tax_rate":"5"
  }],
  "consignee_details":{
    "consignee_name":"Sachin Dubey",
    "consignee_phone":"9555474254",
    "consignee_email":"rahuldubey2000@gmail.com",
    "consignee_complete_address":"Plot 1268 Ground Floor Toshika Niwas Sector In front of Guru Nank Park",
    "consignee_pincode":"122001"
  }
 }
 ]
}
*/
