
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());

// Existing API routes
app.use("/api/community", require("./routes/community"));
app.use("/api/notifications", require("./routes/notification"));
app.use("/api/booking", require("./routes/booking"));
app.use("/api/routes", require("./routes/route"));
app.use("/api/customers", require("./routes/customer"));

// Route reviews API
app.use("/api/reviews", require("./routes/review"));

app.get("/", (req, res) => {
  res.send("Hello, TEDBUS is working");
});

const PORT = process.env.PORT || 5000;
const DBURL = process.env.MONGODB_URI;

async function startServer() {
  try {
    if (!DBURL) {
      throw new Error("MONGODB_URI is missing from server/.env");
    }

    await mongoose.connect(DBURL);
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
