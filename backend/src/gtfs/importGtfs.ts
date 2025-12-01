import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { db } from "../db";
import { Stop, Route, Trip, StopTime } from "../types/gtfs";

const GTFS_DIR = path.join(__dirname, "../../gtfs_files");

async function loadCSV<T>(filename: string): Promise<T[]> {
  const filePath = path.join(GTFS_DIR, filename);

  return new Promise((resolve, reject) => {
    const rows: T[] = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on("data", (data: T) => rows.push(data))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function insertRows(table: string, columns: string[], rows: any[]) {
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT IGNORE INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

  for (let i = 0; i < rows.length; i++) {
    const values = columns.map(col => rows[i][col]);
    try {
      await db.query(sql, values);
    } catch (err) {
      console.error(`Error inserting row ${i} into ${table}:`, err);
    }
    if (i % 1000 === 0) console.log(`Inserted ${i} rows into ${table}...`);
  }
}

export async function importGTFS() {
  console.log("Importing GTFS...");

  const stops = await loadCSV<Stop>("stops.txt");
  const routes = await loadCSV<Route>("routes.txt");
  const trips = await loadCSV<Trip>("trips.txt");
  const stopTimes = await loadCSV<StopTime>("stop_times.txt");

  console.log("Inserting stops...");
  await insertRows("stops", ["stop_id", "stop_name", "stop_lat", "stop_lon"], stops);

  console.log("Inserting routes...");
  await insertRows("routes", ["route_id", "route_short_name", "route_long_name"], routes);

  console.log("Inserting trips...");
  await insertRows("trips", ["trip_id", "route_id", "service_id"], trips);

  console.log("Inserting stop times...");
  await insertRows("stop_times", ["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence"], stopTimes);

  console.log("GTFS Import done!");
}
