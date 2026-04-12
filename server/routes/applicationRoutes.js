const express = require("express");
const router = express.Router();
const {
  apply,
  getMyApplication,
  acknowledge,
  withdraw,
  reject,
  hire,
} = require("../controllers/applicationController");
const {
  protect,
  isCompany,
  isApplicant,
} = require("../middleware/authMiddleware");

// Applicant routes
router.post("/:jobId/apply", protect, isApplicant, apply);
router.get("/:jobId/mystatus", protect, isApplicant, getMyApplication);
router.post("/:jobId/acknowledge", protect, isApplicant, acknowledge);
router.post("/:jobId/withdraw", protect, isApplicant, withdraw);

// Company routes
router.post("/:applicationId/reject", protect, isCompany, reject);
router.post("/:applicationId/hire", protect, isCompany, hire);

module.exports = router;