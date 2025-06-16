// cron/scheduledPayouts.js
const cron             = require("node-cron");
const stripe           = require("stripe")(process.env.STRIPE_SECRET_KEY);
const withdrawals      = require("../models/withdrawal");
const notifyUser       = require("../controllers/paymentController").notifyUser; // re‑use helper

// Every hour, try to process scheduled payouts that are due
cron.schedule("0 * * * *", async () => {
  try {
    const due = await withdrawals.find({
      status  : "scheduled",
      payoutAt: { $lte: new Date() },
    });

    for (const w of due) {
      try {
        await stripe.payouts.create({
          amount     : Math.round(w.amount * 100),
          currency   : "usd",
          destination: w.paymentMethod,
          description: `Scheduled payout ${w._id}`,
        });

        w.status      = "completed";
        w.completedAt = new Date();
        await w.save();

        await notifyUser(
          w.user.toString(),
          "Withdrawal",
          `Your scheduled payout of $${w.amount.toFixed(2)} has been completed.`,
          { withdrawId: w._id.toString() }
        );
      } catch (err) {
        console.error("Scheduled payout error:", err);
      }
    }
  } catch (e) {
    console.error("cron job fetch error:", e);
  }
});

console.log("⏰ Scheduled payout cron loaded");
