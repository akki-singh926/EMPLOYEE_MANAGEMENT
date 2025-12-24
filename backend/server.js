require('dotenv').config();
const connectDB = require('./config/db');
connectDB(process.env.MONGO_URI);

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Import Routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const hrRoutes = require('./routes/hr');
const superAdminRoutes = require('./routes/superAdmin');

const app = express();

// ----------------------
// MIDDLEWARES
// ----------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Helmet Security Config (Allowed for iframe/localhost:3000)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        frameAncestors: ["'self'", 'http://localhost:3000'],
      },
    },
    xFrameOptions: false,
  })
);

// ----------------------
// STATIC FILES (UPLOADS)
// ----------------------
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// ----------------------
// ROUTES
// ----------------------
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/admin', hrRoutes); // OK if intentional
app.use('/api/superAdmin', superAdminRoutes);

// ----------------------
// GLOBAL ERROR HANDLER
// ----------------------
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});


// ----------------------
// START SERVER (🔥 THIS WAS MISSING)
// ----------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
