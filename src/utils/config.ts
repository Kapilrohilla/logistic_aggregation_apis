import dotnev from "dotenv";
dotnev.config();

const MONGODB_URI = process.env.MONGODB_URI;

let SALT_ROUND = Number(process.env.SALT_ROUND) || 10;

const PORT = Number(process.env.PORT) || 8000;

const JWT_SECRET = process.env.JWT_SECRET;

const config = { MONGODB_URI, SALT_ROUND, PORT, JWT_SECRET };

export default config;
