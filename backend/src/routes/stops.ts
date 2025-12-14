import { Router } from "express";
import { db } from "../db";
import { RowDataPacket } from "mysql2";

const router = Router();


router.get("/", async (req, res) => {
    const region = req.query.region as string | undefined;
    if (!region) return res.json([]);

    try {
        let sql = `
            SELECT stop_id, stop_name, stop_desc
            FROM stops
            WHERE stop_area = ?
            ORDER BY stop_name, stop_desc
        `;
        const params: any[] = [region];

        if (region.toLowerCase() === "tallinn linn") {
            sql = `
                SELECT stop_id, stop_name, stop_desc
                FROM stops
                WHERE stop_area LIKE '%Tallinn%' OR authority LIKE 'Tallinna%'
                ORDER BY stop_name, stop_desc
            `;
            params.length = 0;
        }

        const [rows] = await db.query<RowDataPacket[]>(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});


/* ================= REGIONS ================= */

router.get("/regions/cities", async (_req, res) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT DISTINCT
        CASE
          WHEN stop_area LIKE '%-Tallinn'
            OR stop_area = 'Tallinn'
            OR authority LIKE 'Tallinna%'
          THEN 'Tallinn linn'
          WHEN stop_area LIKE '% linn'
          THEN stop_area
          ELSE NULL
        END AS stop_area
      FROM stops
      `
    );
    res.json(rows.filter(r => r.stop_area));
  } catch {
    res.status(500).json([]);
  }
});

router.get("/regions/others", async (_req, res) => {
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
  } catch {
    res.status(500).json([]);
  }
});

/* ================= NEAREST ================= */

router.get("/nearest", async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (isNaN(lat) || isNaN(lon)) return res.status(400).json({});

  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT *,
      SQRT(POW(stop_lat - ?, 2) + POW(stop_lon - ?, 2)) AS dist
    FROM stops
    ORDER BY dist
    LIMIT 1
    `,
    [lat, lon]
  );

  res.json(rows[0]);
});

/* ================= BUSES ================= */

router.get("/:stopName/buses", async (req, res) => {
  try {
    const [stopRows] = await db.query<RowDataPacket[]>(
      "SELECT stop_id FROM stops WHERE LOWER(TRIM(stop_name)) = LOWER(TRIM(?))",
      [req.params.stopName]
    );
    if (!stopRows.length) return res.json([]);

    const stopId = stopRows[0].stop_id;

    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT DISTINCT r.route_short_name
      FROM stop_times st
      JOIN trips t ON st.trip_id = t.trip_id
      JOIN routes r ON t.route_id = r.route_id
      WHERE st.stop_id = ?
      ORDER BY r.route_short_name
      `,
      [stopId]
    );

    res.json(rows.map(r => r.route_short_name));
  } catch {
    res.status(500).json([]);
  }
});

router.get("/:stopId/busesWithDirectionById", async (req, res) => {
  const stopId = Number(req.params.stopId);
  if (!stopId) return res.json([]);

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT r.route_short_name, t.trip_headsign
      FROM stop_times st
      JOIN trips t ON st.trip_id = t.trip_id
      JOIN routes r ON t.route_id = r.route_id
      WHERE st.stop_id = ?
      ORDER BY r.route_short_name
      `,
      [stopId]
    );

    res.json(rows.map(r => ({
      route: r.route_short_name,
      direction: r.trip_headsign || "unknown"
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});




/* ================= ARRIVALS ================= */

router.get("/:stopName/arrivals", async (req, res) => {
  const stopName = req.params.stopName;
  const route = req.query.route as string | undefined;

  try {
    const [stopRows] = await db.query<RowDataPacket[]>(
      "SELECT stop_id FROM stops WHERE LOWER(TRIM(stop_name)) = LOWER(TRIM(?))",
      [stopName]
    );
    if (!stopRows.length) return res.json([]);

    const stopId = stopRows[0].stop_id;

    if (route) {
      const [rows] = await db.query<RowDataPacket[]>(
        `
        SELECT st.arrival_time
        FROM stop_times st
        JOIN trips t ON st.trip_id = t.trip_id
        JOIN routes r ON t.route_id = r.route_id
        WHERE st.stop_id = ?
          AND r.route_short_name = ?
          AND st.arrival_time >= CURTIME()
        ORDER BY st.arrival_time
        LIMIT 5
        `,
        [stopId, route]
      );
      const arrivals = (rows as any[]).map(r => ({ arrival_time: r.arrival_time }));
      return res.json(arrivals);
    }

    const [buses] = await db.query<RowDataPacket[]>(
      `
      SELECT DISTINCT r.route_short_name
      FROM stop_times st
      JOIN trips t ON st.trip_id = t.trip_id
      JOIN routes r ON t.route_id = r.route_id
      WHERE st.stop_id = ?
      `,
      [stopId]
    );

    const arrivalsResult: Record<string, { arrival_time: string }[]> = {};

    for (const bus of buses.map(b => b.route_short_name)) {
      const [rows] = await db.query<RowDataPacket[]>(
        `
        SELECT st.arrival_time
        FROM stop_times st
        JOIN trips t ON st.trip_id = t.trip_id
        JOIN routes r ON t.route_id = r.route_id
        WHERE st.stop_id = ?
          AND r.route_short_name = ?
          AND st.arrival_time >= CURTIME()
        ORDER BY st.arrival_time
        LIMIT 5
        `,
        [stopId, bus]
      );
      arrivalsResult[bus] = (rows as any[]).map(r => ({ arrival_time: r.arrival_time }));
    }

    res.json(arrivalsResult);

  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});




export default router;
