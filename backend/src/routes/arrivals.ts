import { Router } from "express";
import { db } from "../db";
import { RowDataPacket } from "mysql2";

const router = Router();

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
    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT DISTINCT r.route_short_name
      FROM stop_times st
      JOIN trips t ON st.trip_id = t.trip_id
      JOIN routes r ON t.route_id = r.route_id
      JOIN stops s ON st.stop_id = s.stop_id
      WHERE LOWER(TRIM(s.stop_name)) = LOWER(TRIM(?))
      ORDER BY r.route_short_name
      `,
      [req.params.stopName]
    );
    res.json(rows.map(r => r.route_short_name));
  } catch {
    res.status(500).json([]);
  }
});

/* ================= ARRIVALS ================= */

// router.get("/:stopName/arrivals", async (req, res) => {
//   const stopName = req.params.stopName;
//   const route = req.query.route as string | undefined;

//   try {
//     // let sql = `
//     //   SELECT DISTINCT st.arrival_time
//     //   FROM stop_times st
//     //   JOIN trips t ON st.trip_id = t.trip_id
//     //   JOIN routes r ON t.route_id = r.route_id
//     //   JOIN stops s ON st.stop_id = s.stop_id
//     //   WHERE LOWER(TRIM(s.stop_name)) = LOWER(TRIM(?)) 
//     //     AND (? IS NULL OR r.route_short_name = ?)
//     //   ORDER BY st.arrival_time;

//     // `;
//     let sql = `
//       SELECT st.arrival_time
//       FROM stop_times st
//       JOIN trips t ON st.trip_id = t.trip_id
//       JOIN routes r ON t.route_id = r.route_id
//       JOIN stops s ON st.stop_id = s.stop_id
//       WHERE LOWER(TRIM(s.stop_name)) = LOWER(TRIM(?))
//         AND r.route_short_name = ?
//         AND st.arrival_time >= CURTIME()
//       ORDER BY st.arrival_time
//       LIMIT 5;
//     `;
//     const params = [stopName, route];

//     if (route) {
//       sql += " AND r.route_short_name = ?";
//       params.push(route);
//     }

//     sql += " ORDER BY st.arrival_time";

//     const [rows] = await db.query<RowDataPacket[]>(sql, params);

//     // JS-фильтр на случай дубликатов
//     const uniqueArrivals = [...new Set(rows.map(r => r.arrival_time))].map(t => ({ arrival_time: t }));
//     res.json(uniqueArrivals);

//   } catch {
//     res.status(500).json([]);
//   }
// });

export default router;
