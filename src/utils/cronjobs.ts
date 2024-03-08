import axios from "axios";
import { B2COrderModel } from "../models/order.model";
import config from "./config";
import APIs from "./constants/third_party_apis";
import { getSmartShipToken } from "./helpers";
import * as cron from "node-cron";

/**
 * Update order with statusCode (2) to cancelled order(3)
 * prints Error if occurred during this process
 * @returns Promise(void)
 */
const CANCEL_REQUESTED_ORDER = async (): Promise<void> => {
  // get all order with statusCode 2,
  const orderUnderCancellation = await B2COrderModel.find({ orderStage: 2 });
  const order_referenceIds4smartship = orderUnderCancellation.map(
    (order) => order._id + "_" + order.order_reference_id
  );

  // hit cancellation api
  const requestBody = {
    request_info: {},
    orders: {
      client_order_reference_ids: order_referenceIds4smartship,
    },
  };
  const smartshipToken = await getSmartShipToken();
  if (!smartshipToken) {
    return console.warn("FAILED TO RUN JOB, SMARTSHIPTOKEN NOT FOUND");
  }
  const apiUrl = config.SMART_SHIP_API_BASEURL + APIs.CANCEL_SHIPMENT;
  const shipmentAPIConfig = { headers: { Authorization: smartshipToken } };

  const responseJSON = await (await axios.post(apiUrl, requestBody, shipmentAPIConfig)).data;
  console.log("-----------responseJSON------------");
  console.log(JSON.stringify(responseJSON));
  console.log("-----------responseJSON------------");

  const order_cancellation_details = responseJSON?.data?.order_cancellation_details;
  const failures = order_cancellation_details?.failure;
  let cancelled_order;
  if (failures) {
    const failureKeys = Object.keys(failures);
    // finding order_reference_ids with message: "Already Cancelled."
    cancelled_order = failureKeys
      .filter((key) => {
        return failures[key]?.message === "Already Cancelled.";
      })
      .map((key) => {
        return key.split("_")[1];
      });
  }
  // update db
  const findQuery = { order_reference_id: { $in: cancelled_order } };
  const ack = await B2COrderModel.updateMany(findQuery, { orderStage: 3 });
  console.log("cronjob executed");
  console.log(ack);
};

/**
 * function to run CronJobs currrently one cron is scheduled to update the status of order which are cancelled to "Already Cancelled".
 * @emits CANCEL_REQUESTED_ORDER
 * @returns void
 */
export default function runCron() {
  const expression4everyMinute = "* * * * *";
  if (cron.validate(expression4everyMinute)) {
    cron.schedule(expression4everyMinute, CANCEL_REQUESTED_ORDER);
  }
}
