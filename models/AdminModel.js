const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    chatId: {
        type: String,
        
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    timeAt: {
        type: [Date], // Mảng các thời gian đăng nhập
        default: []
    }
});

// Tạo model Admin
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
