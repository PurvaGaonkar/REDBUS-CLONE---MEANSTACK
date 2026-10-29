
const Route = require("../models/route");
const Bus = require("../models/bus");
const Booking = require("../models/booking");

exports.getoneroute = async (req, res) => {
  try {
    const { departure, arrival, date } = req.params;

    if (!departure || !arrival || !date) {
      return res.status(400).json({
        message: "Departure, arrival and date are required."
      });
    }

    // Find the route between the selected cities.
    const routes = await Route.find().lean();

    const route = routes.find((item) => {
      const departureName = item.departureLocation?.name;
      const arrivalName = item.arrivalLocation?.name;

      return (
        departureName?.trim().toLowerCase() ===
          decodeURIComponent(departure).trim().toLowerCase() &&
        arrivalName?.trim().toLowerCase() ===
          decodeURIComponent(arrival).trim().toLowerCase()
      );
    });

    if (!route) {
      return res.status(200).json({
        route: null,
        matchedBuses: [],
        busidwithseatobj: {},
        message: "No route found for the selected cities."
      });
    }

    // Find buses associated with this route.
    const matchedBuses = await Bus.find({
      routes: route._id
    }).lean();

    if (matchedBuses.length === 0) {
      return res.status(200).json({
        route,
        matchedBuses: [],
        busidwithseatobj: {},
        message: "No buses are registered for this route."
      });
    }

    // Find bookings and calculate seats already booked on this date.
    const bookings = await Booking.find({
      "departureDetails.date": date
    }).select("busId seats departureDetails.date").lean();

    const busidwithseatobj = {};

    for (const bus of matchedBuses) {
      const busId = bus._id.toString();

      const bookedSeats = bookings
        .filter(
          (booking) => booking.busId?.toString() === busId
        )
        .flatMap((booking) => booking.seats || []);

      busidwithseatobj[busId] = bookedSeats;
    }

    return res.status(200).json({
      route,
      matchedBuses,
      busidwithseatobj
    });
  } catch (error) {
    console.error("Error fetching buses:", error);

    return res.status(500).json({
      message: "Failed to fetch buses.",
      error: error.message
    });
  }
};
