import { Router } from "express";
import { createShipment } from "../controllers/shipment.controller";

const shipmentRouter = Router();

//@ts-ignore
shipmentRouter.post("/", createShipment);

export default shipmentRouter;
