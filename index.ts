import express from "express";
import type { Request, Response } from "express";
import authRouter from "./src/routes/auth.routes";
import mongoose from "mongoose";
const app = express();
import config from "./src/utils/config";
import orderRouter from "./src/routes/order.routes";
import { AuthMiddleware, ErrorHandler } from "./src/utils/middleware";

app.use(express.json());

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
  })
  .catch((err) => {
    console.log(err.message);
  });

app.use("/auth", authRouter);

// @ts-ignore (as Request object is extended with new property seller)
app.use(AuthMiddleware);

app.use("/order", orderRouter);

app.use(ErrorHandler);
app.use("*", (req: Request, res: Response) => {
  return res.status(404).send({
    valid: false,
    message: "invalid route",
  });
});

app.listen(config.PORT, () => console.log("server running on port " + config.PORT));
