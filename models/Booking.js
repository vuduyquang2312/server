const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    pickupPoint: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    pickupDate: {
        type: String,
        required: true
    },
    pickupTime: {
        type: String,
        required: true
    },
    vehicleType: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    bookingTime: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    isSend: {
        type: Boolean,
        default: false // Mặc định là false
    }
}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
