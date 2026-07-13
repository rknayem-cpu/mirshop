const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    
    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // কানেকশন ফেইল হলে সার্ভার বন্ধ করে দেওয়া ভালো অভ্যাস
    process.exit(1); 
  }
};

module.exports = connectDB;
