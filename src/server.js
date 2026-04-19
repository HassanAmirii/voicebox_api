import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
const port = process.env.PORT || 3000;
const options = {
  autoIndex: false,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  family: 4,
};

//  exponential back off
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function connectWithRetry() {
  let delay = 1000;
  for (let retry = 0; retry < 5; retry++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, options);
      console.log("succesfully connected to the database");
      app.listen(port, () => console.log(`Server running on port ${port}`));
      return;
    } catch (error) {
      console.error("error connecting to the database:", error);
      await wait(delay);
      delay *= 2;
    }
  }
  // exit if connection still unsuccesful after 5 retries
  process.exit(1);
}

connectWithRetry();
