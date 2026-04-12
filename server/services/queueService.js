const Application = require("../models/Application");
const Job = require("../models/Job");

// Get the next waitlist position for a job
const getNextWaitlistPosition = async (jobId) => {
  const lastWaitlisted = await Application.findOne({
    job: jobId,
    status: "waitlisted",
  }).sort({ waitlistPosition: -1 });

  return lastWaitlisted ? lastWaitlisted.waitlistPosition + 1 : 1;
};

// Promote next waitlisted applicant to active
const promoteNextApplicant = async (jobId) => {
  const job = await Job.findById(jobId);
  if (!job || !job.isOpen) return;

  // Check if there is an available slot
  const activeCount = await Application.countDocuments({
    job: jobId,
    status: "active",
  });

  if (activeCount >= job.activeCapacity) return;

  // Find the next waitlisted applicant
  const nextApplicant = await Application.findOne({
    job: jobId,
    status: "waitlisted",
  }).sort({ waitlistPosition: 1 });

  if (!nextApplicant) return;

  // Promote them to active
  nextApplicant.status = "active";
  nextApplicant.promotedAt = new Date();
  nextApplicant.acknowledgedAt = null;
  nextApplicant.waitlistPosition = null;
  nextApplicant.logs.push({
    action: "PROMOTED_TO_ACTIVE",
    details: "Automatically promoted from waitlist to active",
  });

  await nextApplicant.save();

  // Update job active count
  await Job.findByIdAndUpdate(jobId, { $inc: { currentActiveCount: 1 } });

  console.log(`✅ Applicant ${nextApplicant.applicant} promoted to active!`);

  return nextApplicant;
};

// Apply for a job
const applyForJob = async (jobId, applicantId) => {
  const job = await Job.findById(jobId);

  if (!job) throw new Error("Job not found");
  if (!job.isOpen) throw new Error("Job is closed");

  // Check if already applied
  const existingApplication = await Application.findOne({
    job: jobId,
    applicant: applicantId,
  });

  if (existingApplication) throw new Error("Already applied for this job");

  // Check active slots using findOneAndUpdate for atomic operation
  // This handles the race condition when two people apply at the same time
  const updatedJob = await Job.findOneAndUpdate(
    {
      _id: jobId,
      isOpen: true,
      $expr: { $lt: ["$currentActiveCount", "$activeCapacity"] },
    },
    { $inc: { currentActiveCount: 1 } },
    { new: true }
  );

  let status, waitlistPosition;

  if (updatedJob) {
    // Slot was available and atomically claimed
    status = "active";
    waitlistPosition = null;
  } else {
    // No slot available → go to waitlist
    status = "waitlisted";
    waitlistPosition = await getNextWaitlistPosition(jobId);
  }

  // Create application
  const application = await Application.create({
    job: jobId,
    applicant: applicantId,
    status,
    waitlistPosition,
    logs: [
      {
        action: status === "active" ? "APPLIED_ACTIVE" : "APPLIED_WAITLISTED",
        details:
          status === "active"
            ? "Applied and directly placed in active review"
            : `Applied and placed in waitlist at position ${waitlistPosition}`,
      },
    ],
  });

  return application;
};

// Exit pipeline (withdraw or reject)
const exitPipeline = async (applicationId, reason) => {
  const application = await Application.findById(applicationId);
  if (!application) throw new Error("Application not found");

  const wasActive = application.status === "active";

  // Update application status
  application.status = reason;
  application.logs.push({
    action: "EXITED_PIPELINE",
    details: `Exited pipeline with reason: ${reason}`,
  });

  await application.save();

  // If they were active, decrease count and promote next
  if (wasActive) {
    await Job.findByIdAndUpdate(application.job, {
      $inc: { currentActiveCount: -1 },
    });
    await promoteNextApplicant(application.job);
  }

  // If they were waitlisted, reorder positions
  if (application.status === "waitlisted") {
    await reorderWaitlist(application.job, application.waitlistPosition);
  }

  return application;
};

// Reorder waitlist after someone exits
const reorderWaitlist = async (jobId, removedPosition) => {
  await Application.updateMany(
    {
      job: jobId,
      status: "waitlisted",
      waitlistPosition: { $gt: removedPosition },
    },
    { $inc: { waitlistPosition: -1 } }
  );
};

module.exports = {
  applyForJob,
  exitPipeline,
  promoteNextApplicant,
  getNextWaitlistPosition,
  reorderWaitlist,
};