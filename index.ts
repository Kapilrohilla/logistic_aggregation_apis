import express from "express";
import type { Request, Response } from "express";
import authRouter from "./src/routes/auth.routes";
import mongoose from "mongoose";
const app = express();
import config from "./src/utils/config";
import orderRouter from "./src/routes/order.routes";
import { AuthMiddleware, ErrorHandler } from "./src/utils/middleware";
import { addVendors, connectSmartShip, getSellers, ratecalculatorController } from "./src/utils/helpers";
import hubRouter from "./src/routes/hub.routes";
import cors from "cors";
import customerRouter from "./src/routes/customer.routes";
import morgan from "morgan";
import shipmentRouter from "./src/routes/shipment.routes";

app.use(cors());

app.use(express.json());

//@ts-ignore
morgan.token("reqbody", (req, res) => JSON.stringify(req.body));
app.use(morgan(":method :url :status - :response-time ms - :reqbody"));

app.get("/ping", (_req, res: Response) => {
  return res.send("pong");
});

if (!config.MONGODB_URI) {
  console.log("MONGODB_URI doesn't exists: " + config.MONGODB_URI);
  process.exit(0);
}
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log(" db connected successfully");
    connectSmartShip();
  })
  .catch((err) => {
    console.log(err.message);
  });

app.use("/auth", authRouter);
app.post("/vendor", addVendors);
app.get("/getsellers", getSellers);

// @ts-ignore (as Request object is extended with new property seller)
app.use(AuthMiddleware);
//@ts-ignore
app.post("/ratecalculator", ratecalculatorController);
app.use("/customer", customerRouter);
app.use("/hub", hubRouter);
app.use("/order", orderRouter);
app.use("/shipment", shipmentRouter);

app.use(ErrorHandler);
app.use("*", (req: Request, res: Response) => {
  return res.status(404).send({
    valid: false,
    message: "invalid route",
  });
});

app.listen(config.PORT, () => console.log("server running on port " + config.PORT));
