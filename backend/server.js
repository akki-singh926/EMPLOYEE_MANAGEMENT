require('dotenv').config();
const connectDB = require('./config/db');
connectDB(process.env.MONGO_URI);
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
//const xss = require('xss-clean');
const path = require('path');


const authRoutes = require('./routes/auth');

const app = express();




// middlewares
//app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));


// In server.js

// Helmet provides default security headers, but we need to relax the frame-ancestors setting
app.use(helmet({
    // CRITICAL FIX: Allow framing (iframe loading) from the front-end development port (3000)
    contentSecurityPolicy: {
        directives: {
         
            frameAncestors: ["'self'", 'http://localhost:3000'], // This line explicitly allows the front-end port
           
        }
    },
    // The X-Frame-Options header must also be removed or relaxed
    xFrameOptions: false, // This is often the actual blocker; explicitly disable it for dev/iframe
}));

// routes
app.use('/api/auth', authRoutes);

// static uploads (for dev only) - change for production (use encrypted storage/Cloud)
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));

// global error fallback
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});
const employeeRoutes = require('./routes/employee');
app.use('/api/employee', employeeRoutes);
const hrRoutes = require('./routes/hr');
app.use('/api/hr', hrRoutes);

//changed 
app.use('/api/admin', hrRoutes);
//superAdmin
const superAdmin=require('./routes/superAdmin');
app.use('/api/superAdmin',superAdmin);
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
