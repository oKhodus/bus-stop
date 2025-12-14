import express from "express";
import path from "path";
import cors from "cors";
// import { fileURLToPath } from 'url';
import stopsRouter from "./routes/stops";
import routesRouter from "./routes/routes";
import arrivalsRouter from "./routes/arrivals";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
console.log(__dirname); 

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
// local
// app.listen(3000, () => console.log("Server running on http://localhost:3000"));
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});