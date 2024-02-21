import { Router } from "express";
import { createHub, getHub, getSpecificHub, updateHub } from "../controllers/hub.controller";

const hubRouter = Router();

// @ts-ignore
hubRouter.post("/", createHub);

// @ts-ignore
hubRouter.get("/", getHub);

//@ts-ignore
hubRouter.get("/:id", getSpecificHub);

//@ts-ignore
hubRouter.put("/:id", updateHub);
export default hubRouter;
