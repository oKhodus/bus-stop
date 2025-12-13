import { Router } from "express";
import { db } from "../db";
import { RowDataPacket } from "mysql2";

const router = Router();

router.get("/", async (req, res) => {
    const query = req.query.q as string | undefined;
    if (query) {
        const [rows] = await db.query(
            "SELECT * FROM stops WHERE stop_area LIKE ?",
            [`%${query}%`]
        );
        return res.json(rows);
    }
    const [rows] = await db.query("SELECT * FROM stops LIMIT 100");
    res.json(rows);
});

router.get("/regions", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT stop_area FROM stops ORDER BY stop_area"
    );

    // const regions = rows.map((r: any) => r.stop_area);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

// Cities only (linn)
router.get("/regions/cities", async (req, res) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT DISTINCT
        CASE
          -- All Tallinn districts collapse to 'Tallinn linn'
          WHEN stop_area LIKE '%-Tallinn' OR stop_area LIKE 'Tallinn' OR authority LIKE 'Tallinna%' THEN 'Tallinn linn'
          -- Other cities ending with 'linn'
          WHEN stop_area LIKE '% linn' THEN stop_area
          ELSE NULL
        END AS stop_area
      FROM stops
      ORDER BY stop_area
      `
    );

    // Remove any nulls
    const filtered = rows.filter(r => r.stop_area);
    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

router.get("/regions/others", async (req, res) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT DISTINCT stop_area
      FROM stops
      WHERE stop_area NOT LIKE '% linn'
        AND stop_area IS NOT NULL
        AND stop_area != ''
      ORDER BY stop_area
      `
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});



router.get("/:stopName/buses", async (req, res) => {
    const stopName = req.params.stopName;
    try {
        const [stopsRes]: any = await db.query("SELECT stop_id FROM stops WHERE stop_name = ?", [stopName]);
        if (!stopsRes.length) return res.json([]);
        const stopId = stopsRes[0].stop_id;

        const [stopTimesRes]: any = await db.query("SELECT DISTINCT trip_id FROM stop_times WHERE stop_id = ?", [stopId]);
        if (!stopTimesRes.length) return res.json([]);
        const tripIds = stopTimesRes.map((row: any) => row.trip_id);


        const [tripsRes]: any = await db.query(
            `SELECT DISTINCT route_id FROM trips WHERE trip_id IN (${tripIds.map(() => "?").join(",")})`,
            tripIds
        );
        if (!tripsRes.length) return res.json([]);
        const routeIds = tripsRes.map((row: any) => row.route_id);

        const [routesRes]: any = await db.query(
            `SELECT route_short_name FROM routes WHERE route_id IN (${routeIds.map(() => "?").join(",")}) ORDER BY route_short_name`,
            routeIds
        );

        const busNumbers = routesRes.map((row: any) => row.route_short_name);
        res.json(busNumbers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

router.get("/nearest", async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon)) return res.status(400).json({ error: "Invalid coordinates" });

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT *, 
      SQRT(POW(stop_lat - ?, 2) + POW(stop_lon - ?, 2)) AS distance
     FROM stops
     ORDER BY distance
     LIMIT 1`,
    [lat, lon]
  );

  res.json(rows[0]);
});

export default router;