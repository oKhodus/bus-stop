import express from "express";
import path from "path";
import cors from "cors";
import stopsRouter from "./routes/stops";
import routesRouter from "./routes/routes";
import arrivalsRouter from "./routes/arrivals";

const app = express();
app.use(cors());
app.use(express.json());

// API routes - must be before static files
app.use("/stops", stopsRouter);
app.use("/routes", routesRouter);
app.use("/arrivals", arrivalsRouter);

// Static files
const frontendPath = path.join(__dirname, "../../frontend");
app.use(express.static(frontendPath));

// Catch-all for SPA - must be last and only match non-API routes
// Catch-all for SPA (last!)
app.use((req, res, next) => {
  if (
    req.path.startsWith("/stops") ||
    req.path.startsWith("/routes") ||
    req.path.startsWith("/arrivals")
  ) {
    return next();
  }

  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
