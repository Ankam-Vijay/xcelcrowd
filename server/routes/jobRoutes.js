const express = require("express");
const router = express.Router();
const {
  createJob,
  getAllJobs,
  getCompanyJobs,
  getJobById,
  closeJob,
} = require("../controllers/jobController");
const { protect, isCompany } = require("../middleware/authMiddleware");

// Company only routes
router.post("/", protect, isCompany, createJob);
router.get("/company/myjobs", protect, isCompany, getCompanyJobs);
router.patch("/:id/close", protect, isCompany, closeJob);

// Public routes
router.get("/", getAllJobs);
router.get("/:id", getJobById);

module.exports = router;