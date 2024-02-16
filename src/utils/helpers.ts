import axios from "axios";
import config from "./config";
import EnvModel from "../models/env.model";

export const validateEmail = (email: string) => {
  return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)*[a-zA-Z]{2,}))$/.test(
    email
  );
};

export const connectSmartShip = () => {
  console.log(config.SMART_SHIP_USERNAME);
  console.log(config.SMART_SHIP_PASSWORD);
  console.log(config.SMART_SHIP_CLIENT_ID);
  console.log(config.SMART_SHIP_CLIENT_SECRET);
  console.log(config.SMART_SHIP_GRANT_TYPE);

  const requestBody = {
    username: config.SMART_SHIP_USERNAME,
    password: config.SMART_SHIP_PASSWORD,
    client_id: config.SMART_SHIP_CLIENT_ID,
    client_secret: config.SMART_SHIP_CLIENT_SECRET,
    grant_type: config.SMART_SHIP_GRANT_TYPE,
  };

  axios
    .post("https://oauth.smartship.in/loginToken.php", requestBody)
    .then((r) => {
      console.log("SmartShip API response: " + r.data);
      const responseBody = r.data;
      const savedEnv = new EnvModel(responseBody);
      EnvModel.deleteMany({})
        .then(() => {
          savedEnv
            .save()
            .then((r) => {
              console.log("Environment varibale Document updated successfully");
            })
            .catch((err) => {
              console.log("Error: while adding environment variable to ENV Document");
              console.log(err);
            });
        })
        .catch((err) => {
          console.log("Failed to clean up environment variables Document");
          console.log(err);
        });
    })
    .catch((err) => {
      console.log("SmartShip API Error Response: ");
      console.error(err?.response?.data);
    });
};
