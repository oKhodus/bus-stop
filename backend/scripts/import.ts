import { importGTFS } from "../src/gtfs/importGtfs";

importGTFS()
  .then(() => {
    console.log("GTFS import finished!");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
