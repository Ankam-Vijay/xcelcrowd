const Application = require("../models/Application");
const Job = require("../models/Job");
const { promoteNextApplicant, getNextWaitlistPosition } = require("./queueService");

const DECAY_WINDOW_HOURS = process.env.DECAY_WINDOW_HOURS || 48;
const PENALTY_POSITIONS = parseInt(process.env.PENALTY_POSITIONS) || 5;

// Check if a promoted applicant has exceeded the acknowledgement window
const checkAndDecayInactive = async () => {
  console.log("Running decay check...");

  const decayWindowMs = DECAY_WINDOW_HOURS * 60 * 60 * 1000;
  const cutoffTime = new Date(Date.now() - decayWindowMs);

  // Find all active applicants who were promoted but never acknowledged
  // and their promotion time has exceeded the decay window
  const inactiveApplicants = await Application.find({
    status: "active",
    promotedAt: { $lt: cutoffTime, $ne: null },
    acknowledgedAt: null,
  });

  console.log(`Found ${inactiveApplicants.length} inactive applicants`);

  for (const application of inactiveApplicants) {
    await decayApplicant(application);
  }
};

// Decay a single applicant back to waitlist with penalty
const decayApplicant = async (application) => {
  try {
    const job = await Job.findById(application.job);
    if (!job) return;

    // Get current last waitlist position
    const lastPosition = await getNextWaitlistPosition(application.job);

    // Apply penalty — place them at the end + penalty positions
    const penalizedPosition = lastPosition + PENALTY_POSITIONS;

    // Update application status back to waitlisted
    application.status = "waitlisted";
    application.waitlistPosition = penalizedPosition;
    application.decayCount += 1;
    application.promotedAt = null;
    application.acknowledgedAt = null;
    application.logs.push({
      action: "DECAYED",
      details: `Applicant did not acknowledge within ${DECAY_WINDOW_HOURS} hours. Moved back to waitlist at penalized position ${penalizedPosition}. Decay count: ${application.decayCount}`,
    });

    await application.save();

    // Decrease active count
    await Job.findByIdAndUpdate(application.job, {
      $inc: { currentActiveCount: -1 },
    });

    console.log(
      `Applicant ${application.applicant} decayed to position ${penalizedPosition}`
    );

    // Promote next person in waitlist
    await promoteNextApplicant(application.job);

  } catch (error) {
    console.error("Decay error:", error.message);
  }
};

module.exports = { checkAndDecayInactive, decayApplicant };