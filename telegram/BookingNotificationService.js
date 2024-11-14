const TelegramBot = require('node-telegram-bot-api');
const Booking = require('../models/Booking');
const Admin = require('../models/AdminModel');

class BookingNotificationService {
    constructor(io, bot) {
        this.io = io;
        this.bot = bot;
        this.interval = null;
    }

    // Format tin nhắn thông báo
    formatBookingMessage(booking) {
        return `🔔 *Thông Báo Đặt Xe Mới*\n\n` +
               `👤 Khách hàng: ${booking.customerName}\n \n` +
               `📞 Số điện thoại: ${booking.phoneNumber}\n \n` +
               `🚗 Loại xe: ${booking.vehicleType}\n \n` +
               `📍 Điểm đón: ${booking.pickupPoint}\n \n` +
               `🏁 Điểm đến: ${booking.destination}\n \n` +
               `📅 Ngày đón: ${booking.pickupDate}\n \n` +
               `⏰ Giờ đón: ${booking.pickupTime}\n \n` +
               `💰 Giá: ${booking.price.toLocaleString('vi-VN')} VNĐ\n \n` +
               `🕒 Thời gian đặt: ${booking.bookingTime}`;
    }

    // Gửi thông báo qua Telegram
    async sendTelegramNotification(booking, adminChatId) {
        try {
            await this.bot.sendMessage(
                adminChatId,
                this.formatBookingMessage(booking),
                { parse_mode: 'Markdown' }
            );
            return true;
        } catch (error) {
            console.error('Lỗi gửi thông báo Telegram:', error);
            return false;
        }
    }

    // Cập nhật trạng thái isSend
    async updateBookingStatus(bookingId) {
        try {
            await Booking.findByIdAndUpdate(bookingId, { isSend: true });
            // Emit socket event để cập nhật UI
            this.io.emit('bookingUpdated', { bookingId, isSend: true });
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái booking:', error);
        }
    }

    // Kiểm tra và xử lý booking mới
    async checkNewBookings() {
        try {
            // Tìm tất cả booking chưa được gửi
            const pendingBookings = await Booking.find({ isSend: false });
            
            if (pendingBookings.length > 0) {
                // Lấy danh sách admin
                const admins = await Admin.find({});
                
                for (const booking of pendingBookings) {
                    // Gửi thông báo cho tất cả admin
                    for (const admin of admins) {
                        if (admin.chatId) {
                            const sent = await this.sendTelegramNotification(booking, admin.chatId);
                            if (sent) {
                                await this.updateBookingStatus(booking._id);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Lỗi kiểm tra booking mới:', error);
        }
    }

    // Khởi động service
    start() {
        // Kiểm tra mỗi giây
        this.interval = setInterval(() => {
            this.checkNewBookings();
        }, 5000);
        
        console.log('Booking notification service started');
    }

    // Dừng service
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        console.log('Booking notification service stopped');
    }
}

module.exports = BookingNotificationService;