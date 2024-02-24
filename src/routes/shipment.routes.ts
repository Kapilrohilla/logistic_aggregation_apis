import { Router } from "express";
import { cancelShipment, createShipment, trackShipment } from "../controllers/shipment.controller";

const shipmentRouter = Router();

//@ts-ignore
shipmentRouter.post("/", createShipment);

//@ts-ignore
shipmentRouter.post("/cancel", cancelShipment);

//@ts-ignore
shipmentRouter.post("/track", trackShipment);

export default shipmentRouter;
