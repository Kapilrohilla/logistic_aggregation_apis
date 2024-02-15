import { Router } from "express";
import { createOrder, getOrders } from "../controllers/order.controller";

// ts-ignore is used as contollers request type is extended with custom property seller

const orderRouter = Router();

// @ts-ignore
orderRouter.get("/", getOrders);

// @ts-ignore
orderRouter.post("/", createOrder);

export default orderRouter;
