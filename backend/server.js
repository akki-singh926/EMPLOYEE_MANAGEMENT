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

// connect db


// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
//app.use(xss());



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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));//hey
