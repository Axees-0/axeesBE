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
   
   /* cron job */
   require('./cron/activationReminders');
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
   app.use(cors());
   
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
   app.use('/api/find',     findRoutes);
   
   /* Payments need req.user.id – inject via manualAuth first */
   app.use('/api/connect', manualAuth, connectRoutes);
   app.use('/api/payments', manualAuth, paymentRoutes);
   
   app.use('/api/chats',              chatRoutes);
   
   /* ── 7.  ROOT & 404 ----------------------------------------------------- */
   app.get('/', (_req, res) => res.status(200).send('Hello from Axees backend!'));
   
   app.use((_req, res) =>
     res.status(404).json({ error: 'Route not found' })
   );
   
   /* ── 8.  START SERVER --------------------------------------------------- */
   const PORT = process.env.PORT || 8080;
   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

   
   