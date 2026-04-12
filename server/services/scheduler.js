const cron = require("node-cron");
const { checkAndDecayInactive } = require("./decayService");

// Run decay check every hour
const startScheduler = () => {
  console.log("Scheduler started!");

  // Runs every hour → "0 * * * *"
  // For testing runs every minute → "* * * * *"
  cron.schedule("* * * * *", async () => {
    try {
      await checkAndDecayInactive();
    } catch (error) {
      console.error("Scheduler error:", error.message);
    }
  });
};

module.exports = { startScheduler };