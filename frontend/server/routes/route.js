
const express = require("express");
const router = express.Router();

const routecontroller = require("../controller/route");

// GET /api/routes/:departure/:arrival/:date
router.get(
  "/:departure/:arrival/:date",
  routecontroller.getoneroute
);

module.exports = router;
