// app.use(express.json());

// app.use("/stops", stopsRouter);
// app.use("/routes", routesRouter);

// app.listen(3000, () => {
//   console.log("Server running on http://localhost:3000");
// });


import express from "express";
import path from "path";
import cors from "cors";
import stopsRouter from "./routes/stops";
import routesRouter from "./routes/routes";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/stops", stopsRouter);
app.use("/routes", routesRouter);

const frontendPath = path.join(__dirname, "../../frontend");
app.use(express.static(frontendPath));

app.get(/^\/(?!stops|routes).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
