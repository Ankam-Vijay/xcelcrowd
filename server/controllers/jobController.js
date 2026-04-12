const Job = require("../models/Job");
const Application = require("../models/Application");

// Create a job opening
const createJob = async (req, res) => {
  try {
    const { title, description, activeCapacity } = req.body;

    const job = await Job.create({
      title,
      description,
      company: req.user.userId,
      activeCapacity,
      currentActiveCount: 0,
    });

    res.status(201).json({
      message: "Job created successfully!",
      job,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all jobs (for applicants to see)
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isOpen: true })
      .populate("company", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ jobs });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get company's own jobs
const getCompanyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ company: req.user.userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({ jobs });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single job with pipeline stats
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "company",
      "name email"
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Get pipeline stats
    const activeCount = await Application.countDocuments({
      job: job._id,
      status: "active",
    });

    const waitlistCount = await Application.countDocuments({
      job: job._id,
      status: "waitlisted",
    });

    const activeApplicants = await Application.find({
      job: job._id,
      status: "active",
    }).populate("applicant", "name email");

    const waitlistedApplicants = await Application.find({
      job: job._id,
      status: "waitlisted",
    })
      .populate("applicant", "name email")
      .sort({ waitlistPosition: 1 });

    res.status(200).json({
      job,
      pipeline: {
        activeCapacity: job.activeCapacity,
        activeCount,
        waitlistCount,
        availableSlots: job.activeCapacity - activeCount,
        activeApplicants,
        waitlistedApplicants,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Close a job
const closeJob = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      company: req.user.userId,
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    job.isOpen = false;
    await job.save();

    res.status(200).json({ message: "Job closed successfully!", job });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getCompanyJobs,
  getJobById,
  closeJob,
};