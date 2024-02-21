import mongoose from "mongoose";

const EnvSchema = new mongoose.Schema(
  {
    access_token: String,
    expires_in: Number,
    token_type: String,
    scope: String,
    refresh_token: String,
  },
  { timestamps: true }
);

const EnvModel = mongoose.model("Env", EnvSchema);
export default EnvModel;
