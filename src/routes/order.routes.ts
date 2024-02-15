import { Router } from "express";
import { createOrder, getOrders } from "../controllers/order.controller";

const orderRouter = Router();

// get order list
orderRouter.get("/", getOrders);

// create order
orderRouter.post("/", createOrder);

export default orderRouter;
