require('dotenv').config();
const app = require('./app');
const connectDB = require('./utils/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Smart ATS API running on port ${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  });
};

start();