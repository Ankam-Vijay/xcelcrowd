const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token, access denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const isCompany = (req, res, next) => {
  if (req.user.role !== "company") {
    return res.status(403).json({ message: "Only companies can do this" });
  }
  next();
};

const isApplicant = (req, res, next) => {
  if (req.user.role !== "applicant") {
    return res.status(403).json({ message: "Only applicants can do this" });
  }
  next();
};

module.exports = { protect, isCompany, isApplicant };