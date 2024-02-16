import mongoose from "mongoose";

const EnvSchema = new mongoose.Schema({
  access_token: String,
  expires_in: Number,
  token_type: String,
  scope: String,
  refresh_token: String,
});

const EnvModel = mongoose.model("Env", EnvSchema);
export default EnvModel;
