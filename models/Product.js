const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bio: { type: String, required: true },
  images: { type: [String], required: true }, // এটি একটি Array হিসেবে ৪টি URL ই জমা রাখবে
  category: { type: String, required: true },
  price: { type: Number, required: true },
  isDiscount: { type: Boolean, default: false },
  discountPrice: { type: Number, default: null },
  isNewArrival: { type: Boolean, default: false }
}, { timestamps: true }); // এতে অটোমেটিক createdAt এবং updatedAt তৈরি হবে

module.exports = mongoose.model('Product', productSchema);
