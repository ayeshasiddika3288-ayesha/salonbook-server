
import dns from "node:dns";
import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";
import { connectAuthDB } from "./lib/auth.js";

// Fix Windows Node.js SRV DNS issue
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect Mongoose database
    await connectDB();

    // Connect Better Auth database
    await connectAuthDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`SalonBook server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
