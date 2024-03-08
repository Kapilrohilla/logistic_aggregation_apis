export const HUB_REGISTRATION = "/v2/app/Fulfillmentservice/hubRegistration";
export const HUB_UPDATE = "/v2/app/Fulfillmentservice/updateHubDetails";
export const HUB_DELETE = "/v2/app/Fulfillmentservice/deleteHub";

export const HUB_SERVICEABILITY = "/v2/app/Fulfillmentservice/ServiceabilityHubWise";

export const CREATE_SHIPMENT = "/v2/app/Fulfillmentservice/orderRegistration";
export const CANCEL_SHIPMENT = "/v2/app/Fulfillmentservice/orderCancellation";
export const TRACK_SHIPMENT = "/v1/Trackorder?order_reference_ids"; // url => TRACK_SHIPMENT+"=order_reference_id"

const APIs = {
  HUB_REGISTRATION,
  HUB_UPDATE,
  HUB_DELETE,
  CREATE_SHIPMENT,
  HUB_SERVICEABILITY,
  CANCEL_SHIPMENT,
  TRACK_SHIPMENT,
};
export default APIs;
