import { Router } from "express";
import { createHub, getHub } from "../controllers/hub.controller";

const hubRouter = Router();

// @ts-ignore
hubRouter.post("/", createHub);

// @ts-ignore
hubRouter.get("/", getHub);

export default hubRouter;
