const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = require("./app");

// Load env vars
dotenv.config({ path: "./config/config.env" });

// Connect DB
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    "Server running in",
    process.env.NODE_ENV,
    "mode on port",
    PORT
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});