// apps/axeesBE/main.js
/* eslint‑disable import/first */

/* ───────────────────────────────────────────────
   1. BOOTSTRAP & DEPENDENCIES
   ───────────────────────────────────────────── */
   if (process.env.NODE_ENV !== 'production') {
      require('dotenv').config();
    }

   const express         = require('express');
   const mongoose        = require('mongoose');
   const cors            = require('cors');
   const swaggerJsDoc    = require('swagger-jsdoc');
   const swaggerUi       = require('swagger-ui-express');
   const path            = require('path');
   
   /* raw‑body helper for Stripe webhook ONLY */
   const stripeWebhook   = require('./controllers/paymentController')
                            .handleWebhook;
   
   /* helper to inject req.user from ?userId / header / body */
   const { manualAuth }  = require('./controllers/authController');
   
   /* ROUTES */
   const authRoutes            = require('./routes/auth');
   const accountRoutes         = require('./routes/account');
   const notificationsRoute    = require('./routes/notifications');
   const usersRoutes           = require('./routes/users');
   const inviteRoutes          = require('./routes/inviteRoutes');
   const marketerOfferRoutes   = require('./routes/marketerOfferRoutes');
   const marketerDealRoutes    = require('./routes/marketerDealRoutes');
   const chatRoutes            = require('./routes/chat');
   const paymentRoutes         = require('./routes/paymentRoutes');
   const connectRoutes         = require('./routes/connectRoutes');
   const findRoutes            = require('./routes/findRoutes');
   const negotiationRoutes     = require('./routes/negotiationRoutes');
   const profileCompletionRoutes = require('./routes/profileCompletionRoutes');
   const trialOfferRoutes      = require('./routes/trialOfferRoutes');
   const paymentPersistenceRoutes = require('./routes/paymentPersistenceRoutes');
   const qrCodeRoutes          = require('./routes/qrCodeRoutes');
   const milestonePaymentRoutes = require('./routes/milestonePaymentRoutes');
   const automaticPaymentReleaseRoutes = require('./routes/automaticPaymentReleaseRoutes');
   const offerStatusNotificationRoutes = require('./routes/offerStatusNotificationRoutes');
   const contextualCommunicationRoutes = require('./routes/contextualCommunicationRoutes');
   const agreementDisplayRoutes = require('./routes/agreementDisplayRoutes');
   const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
   const profileRoutes = require('./routes/profileRoutes');
   const ghostAccountRoutes = require('./routes/ghostAccountRoutes');
   const calendarRoutes = require('./routes/calendarRoutes');
   const socialMediaRoutes = require('./routes/socialMediaRoutes');
   const proofSubmissionRoutes = require('./routes/proofSubmissionRoutes');
   const dealDashboardRoutes = require('./routes/dealDashboardRoutes');
   const paymentAutoPopulationRoutes = require('./routes/paymentAutoPopulationRoutes');
   const offerCollaborationRoutes = require('./routes/offerCollaborationRoutes');
   const disputeResolutionRoutes = require('./routes/disputeResolutionRoutes');
   
   /* cron job */
   require('./cron/activationReminders');
   require('./cron/profileCompletionReminders');
   require('./cron/trialConversions');
   require('./cron/automaticMilestoneRelease');
   require('./cron/comprehensivePaymentRelease');
   require('./cron/offerStatusNotifications');
   // main.js  (add after mongoose connects)
require("./cron/scheduledPayouts");   //  ⇦ NEW

   
   /* ───────────────────────────────────────────────
      2. EXPRESS APP
      ───────────────────────────────────────────── */
   const app = express();
   
mongoose
  .connect(`${process.env.MONGO_URI}AxeesDB`, {
    useNewUrlParser   : true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('MongoDB connected');

    /* --- keep TempUser indexes in-sync with the schema ------------- */
    await mongoose.model('TempUser').syncIndexes();
    console.log('TempUser indexes verified');
    
    /* automatic payment release job - start after DB connection */
    const scheduleAutomaticPaymentRelease = require('./jobs/automaticPaymentRelease');
    scheduleAutomaticPaymentRelease();
  })
  .catch(err => console.error('MongoDB connection error:', err));

   
   /* ── 3.  STRIPE WEBHOOK  – keep *raw* body ------------------------------ */
   app.post(
     '/api/payments/webhook',
     express.raw({ type: 'application/json' }),   // raw body for signature check
     stripeWebhook
   );
   
   /* ── 4.  GLOBAL MIDDLEWARES -------------------------------------------- */
   app.use(express.json());                       // parse JSON
   app.use(express.urlencoded({ extended: false })); // parse form‑urlencoded
   app.use('/uploads', express.static('uploads'));
   
   // Serve static frontend files
   app.use(express.static('public'));
   
   // Configure CORS for frontend integration
   app.use(cors({
     origin: process.env.NODE_ENV === 'production' 
       ? process.env.FRONTEND_URL 
       : ['http://localhost:3000', 'http://localhost:8080'],
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization']
   }));
   
   /* ── 5.  SWAGGER -------------------------------------------------------- */
   const swaggerOptions = {
     definition: {
       openapi: '3.0.0',
       info: {
         title  : 'Axees Registration & Login API',
         version: '1.0.0',
         description: 'API documentation for Axees Web/Mobile project',
       },
     },
     apis: ['./routes/*.js'],
   };
   app.use(
     '/api-docs',
     swaggerUi.serve,
     swaggerUi.setup(swaggerJsDoc(swaggerOptions))
   );
   
   /* ── 6.  ROUTES --------------------------------------------------------- */
   app.use('/api/auth',               authRoutes);
   app.use('/api/account',            accountRoutes);
   app.use('/api/notifications',      notificationsRoute);
   app.use('/api/users',              usersRoutes);
   app.use('/api/invite',             inviteRoutes);
   app.use('/api/marketer/offers',    marketerOfferRoutes);
   app.use('/api/marketer/deals',     marketerDealRoutes);
   app.use('/api/find',               findRoutes);
   app.use('/api/negotiation',        negotiationRoutes);
   app.use('/api/profile-completion', profileCompletionRoutes);
   app.use('/api/trial-offers',       trialOfferRoutes);
   
   /* Payments need req.user.id – inject via manualAuth first */
   app.use('/api/connect', manualAuth, connectRoutes);
   app.use('/api/payments', manualAuth, paymentRoutes);
   app.use('/api/payment-persistence', manualAuth, paymentPersistenceRoutes);
   app.use('/api/qr', manualAuth, qrCodeRoutes);
   app.use('/api/milestone-payments', manualAuth, milestonePaymentRoutes);
   app.use('/api/auto-releases', manualAuth, automaticPaymentReleaseRoutes);
   app.use('/api/offer-notifications', manualAuth, offerStatusNotificationRoutes);
   app.use('/api/contextual-communication', manualAuth, contextualCommunicationRoutes);
   app.use('/api/agreements', manualAuth, agreementDisplayRoutes);
   app.use('/api/admin/dashboard', manualAuth, adminDashboardRoutes);
   app.use('/api/profile', manualAuth, profileRoutes);
   app.use('/api/ghost-accounts', ghostAccountRoutes);
   app.use('/api/calendar', manualAuth, calendarRoutes);
   app.use('/api/social-media', manualAuth, socialMediaRoutes);
   app.use('/api/proof-submissions', manualAuth, proofSubmissionRoutes);
   app.use('/api/deal-dashboard', manualAuth, dealDashboardRoutes);
   app.use('/api/payment-autopop', manualAuth, paymentAutoPopulationRoutes);
   app.use('/api/offers', manualAuth, offerCollaborationRoutes);
   app.use('/api/deals', manualAuth, disputeResolutionRoutes);
   
   app.use('/api/chats',              chatRoutes);
   
   /* ── 7.  ROOT & 404 ----------------------------------------------------- */
   app.get('/', (_req, res) => {
     res.sendFile(path.join(__dirname, 'public', 'index.html'));
   });
   
   app.use((_req, res) =>
     res.status(404).json({ error: 'Route not found' })
   );
   
   /* ── 8.  START SERVER --------------------------------------------------- */
   const PORT = process.env.PORT || 8080;
   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

   
   