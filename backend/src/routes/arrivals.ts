import { Router } from "express";
import { RowDataPacket } from "mysql2";
import { db } from "../db";

const router = Router();

// Get next arrivals for a specific route at a stop
router.get("/:routeShortName/:stopName", async (req, res) => {
  const routeShortName = req.params.routeShortName;
  const stopName = req.params.stopName;
  const limit = parseInt(req.query.limit as string) || 10;

  console.log(`[Arrivals] Request for route: ${routeShortName}, stop: ${stopName}`);

  try {
    // Get route_id
    const [routeRows] = await db.query<RowDataPacket[]>(
      "SELECT route_id FROM routes WHERE route_short_name = ? LIMIT 1",
      [routeShortName]
    );

    if (routeRows.length === 0) {
      return res.json([]);
    }

    const routeId = routeRows[0].route_id;

    // Get stop_id
    const [stopRows] = await db.query<RowDataPacket[]>(
      "SELECT stop_id FROM stops WHERE stop_name = ? LIMIT 1",
      [stopName]
    );

    if (stopRows.length === 0) {
      return res.json([]);
    }

    const stopId = stopRows[0].stop_id;

    // Get current time in HH:MM:SS format
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS

    // Get upcoming arrivals
    const [arrivals] = await db.query<RowDataPacket[]>(
      `SELECT st.arrival_time, st.departure_time, st.stop_sequence, t.trip_id
       FROM stop_times st
       JOIN trips t ON st.trip_id = t.trip_id
       WHERE t.route_id = ? AND st.stop_id = ? AND st.arrival_time >= ?
       ORDER BY st.arrival_time
       LIMIT ?`,
      [routeId, stopId, currentTime, limit]
    );

    // If no future arrivals today, get first arrivals for tomorrow (wrapping around)
    if (arrivals.length === 0) {
      const [nextArrivals] = await db.query<RowDataPacket[]>(
        `SELECT st.arrival_time, st.departure_time, st.stop_sequence, t.trip_id
         FROM stop_times st
         JOIN trips t ON st.trip_id = t.trip_id
         WHERE t.route_id = ? AND st.stop_id = ?
         ORDER BY st.arrival_time
         LIMIT ?`,
        [routeId, stopId, limit]
      );
      return res.json(nextArrivals);
    }

    res.json(arrivals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
