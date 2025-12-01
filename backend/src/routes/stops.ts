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