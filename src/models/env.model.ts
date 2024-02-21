import mongoose from "mongoose";

const EnvSchema = new mongoose.Schema(
  {
    access_token: { type: String, required: true },
    expires_in: { type: String, required: true },
    token_type: { type: String, required: true },
    scope: { type: String },
    refresh_token: { type: String, required: true },
  },
  { timestamps: true }
);

const EnvModel = mongoose.model("Env", EnvSchema);
export default EnvModel;
