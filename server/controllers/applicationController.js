const Application = require("../models/Application");
const Job = require("../models/Job");
const {
  applyForJob,
  exitPipeline,
} = require("../services/queueService");

// Apply for a job
const apply = async (req, res) => {
  try {
    const application = await applyForJob(
      req.params.jobId,
      req.user.userId
    );

    res.status(201).json({
      message:
        application.status === "active"
          ? "You are placed in active review!"
          : `You are on the waitlist at position ${application.waitlistPosition}`,
      application,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get my application status
const getMyApplication = async (req, res) => {
  try {
    const application = await Application.findOne({
      job: req.params.jobId,
      applicant: req.user.userId,
    }).populate("job", "title description company activeCapacity");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    let message = "";
    if (application.status === "active") {
      message = "You are currently in active review!";
    } else if (application.status === "waitlisted") {
      message = `You are on the waitlist at position ${application.waitlistPosition}`;
    } else {
      message = `Your application status is: ${application.status}`;
    }

    res.status(200).json({ message, application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Acknowledge promotion
const acknowledge = async (req, res) => {
  try {
    const application = await Application.findOne({
      job: req.params.jobId,
      applicant: req.user.userId,
      status: "active",
    });

    if (!application) {
      return res.status(404).json({ message: "No active application found" });
    }

    application.acknowledgedAt = new Date();
    application.logs.push({
      action: "ACKNOWLEDGED",
      details: "Applicant acknowledged their promotion",
    });

    await application.save();

    res.status(200).json({
      message: "Acknowledgement confirmed! You are in active review.",
      application,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Withdraw application
const withdraw = async (req, res) => {
  try {
    const application = await Application.findOne({
      job: req.params.jobId,
      applicant: req.user.userId,
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const updated = await exitPipeline(application._id, "withdrawn");

    res.status(200).json({
      message: "Application withdrawn successfully",
      application: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Company rejects an applicant
const reject = async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const updated = await exitPipeline(application._id, "rejected");

    res.status(200).json({
      message: "Applicant rejected",
      application: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Company marks applicant as hired
const hire = async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const updated = await exitPipeline(application._id, "hired");

    res.status(200).json({
      message: "Applicant hired successfully!",
      application: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { apply, getMyApplication, acknowledge, withdraw, reject, hire };