import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), "backend/.env") });

import mysql from "mysql2/promise";

console.log("DB_HOST =", process.env.DB_HOST);

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});
