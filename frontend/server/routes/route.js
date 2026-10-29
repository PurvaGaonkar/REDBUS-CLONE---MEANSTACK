
const express = require("express");
const router = express.Router();

const routecontroller = require("../controller/route");

// Get buses for a departure, arrival, and travel date
router.get(
  "/routes/:departure/:arrival/:date",
  routecontroller.getoneroute
);

module.exports = router;
