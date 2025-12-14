import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), "backend/.env") });

import mysql from "mysql2/promise";

console.log("DB_HOST =", process.env.MYSQLHOST);

export const db = mysql.createPool({
  host: process.env.MYSQLHOST!,
  user: process.env.MYSQLUSER!,
  password: process.env.MYSQLPASSWORD!,
  database: process.env.MYSQL_DATABASE!,
  port: Number(process.env.MYSQLPORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10
});
