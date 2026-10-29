
const { OAuth2Client } = require("google-auth-library");
const Customer = require("../models/customer");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID is not configured.");
      return res.status(500).json({
        message: "Authentication is not configured.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email_verified) {
      return res.status(401).json({
        message: "Invalid or unverified Google account.",
      });
    }

    const customer = await Customer.findOne({
      email: payload.email,
      googleId: payload.sub,
    });

    if (!customer) {
      return res.status(401).json({
        message: "Customer account not found. Please sign in again.",
      });
    }

    req.user = {
      _id: customer._id,
      email: customer.email,
      name: customer.name,
      isVerified: payload.email_verified === true,
      isAdmin: customer.isAdmin === true,
    };

    next();
  } catch (error) {
    console.error("Authentication verification failed:", error.message);
    return res.status(401).json({
      message: "Authentication failed. Please sign in again.",
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.isAdmin !== true) {
    return res.status(403).json({
      message: "Administrator access required.",
    });
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};
