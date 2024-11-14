const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Middleware để xử lý JSON
router.use(express.json());

// POST /api/bookings - Tạo booking mới
router.post('/bookings', async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();

        // Emit socket event khi có booking mới
        req.app.get('io').emit('newBooking', booking);

        res.status(201).json({
            success: true,
            message: 'Đặt xe thành công',
            data: booking
        });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(400).json({
            success: false,
            message: 'Đặt xe thất bại',
            error: error.message
        });
    }
});

// GET /api/bookings - Lấy danh sách bookings
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách đặt xe',
            error: error.message
        });
    }
});

// GET /api/bookings/:id - Lấy chi tiết một booking
router.get('/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin đặt xe'
            });
        }
        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thông tin đặt xe',
            error: error.message
        });
    }
});

// PUT /api/bookings/:id - Cập nhật trạng thái booking
router.put('/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin đặt xe'
            });
        }

        // Emit socket event khi booking được cập nhật
        req.app.get('io').emit('updateBooking', booking);

        res.json({
            success: true,
            message: 'Cập nhật thông tin đặt xe thành công',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Không thể cập nhật thông tin đặt xe',
            error: error.message
        });
    }
});

module.exports = router;