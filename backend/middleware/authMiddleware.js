const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please login to continue",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Your login route stores the ID as userId
    req.user = {
      id: decoded.userId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token. Please login again.",
    });
  }
}

module.exports = authMiddleware;
