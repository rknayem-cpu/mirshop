const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    // কাস্টমার ইনফরমেশন
    
    orderId: {
        type: Number,
        required: true,
        trim: true
    },
    
    
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        default: ''
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    
    // কার্টের প্রোডাক্ট লিস্ট (Array of Objects)
    items: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            image: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            }
        }
    ],
    
    // বিলিং ও অর্ডার স্ট্যাটাস
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    statusHistory: [
        {
            status: { type: String },
            changedAt: { type: Date, default: Date.now }
        }
    ],
    
    
    paymentMethod: {
        type: String,
        default: 'COD' // Cash on Delivery
    }
}, { 
    timestamps: true // এর ফলে অর্ডারটি কখন তৈরি হলো (createdAt) তা অটো সেভ হয়ে থাকবে
});

module.exports = mongoose.model('Order', OrderSchema);
