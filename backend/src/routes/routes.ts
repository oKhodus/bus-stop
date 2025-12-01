import { Router } from "express";
import { RowDataPacket } from "mysql2";
import { db } from "../db";

const router = Router();

router.get("/", async (_req, res) => {
  const [rows] = await db.query("SELECT * FROM routes LIMIT 200");
  res.json(rows);
});

router.get("/:shortName/stops", async (req, res) => {
  const shortName = req.params.shortName;

  const [routeRows] = await db.query<RowDataPacket[]>(
    "SELECT route_id FROM routes WHERE route_short_name = ? LIMIT 1",
    [shortName]
  );

  if (routeRows.length === 0) return res.json([]);

  const routeId = routeRows[0].route_id;

  const [stops] = await db.query<RowDataPacket[]>(
    `SELECT st.*
     FROM stop_times st
     JOIN trips t ON st.trip_id = t.trip_id
     WHERE t.route_id = ?
     ORDER BY st.stop_sequence`,
    [routeId]
  );

  res.json(stops);
});

export default router;
