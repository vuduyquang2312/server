const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const Admin = require('../models/AdminModel'); // Import Admin model
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const BookingNotificationService = require('./BookingNotificationService');

const userSessions = {}; // Để lưu trữ thông tin người dùng tạm thời

module.exports = (io) => {
    // Xử lý lệnh /start
    const notificationService = new BookingNotificationService(io, bot);
    notificationService.start();

    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const welcomeMessage = `👋 Chào mừng bạn đến với hệ thống!  \n \n
🔑 Vui lòng nhập *tên đăng nhập* của bạn để tiếp tục:`;
        bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
        userSessions[chatId] = { step: 'username', chatId: chatId }; // Lưu trạng thái người dùng và chatId
    });
    bot.onText(/\/chatid/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, `🔹 Chat ID của bạn là: *${chatId}*`, { parse_mode: 'Markdown' });
    });
    // Xử lý tin nhắn người dùng
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Kiểm tra trạng thái người dùng
        const session = userSessions[chatId];

        // Nếu không phải lệnh /start, xử lý yêu cầu đăng nhập
        if (session && session.step === 'username') {
            userSessions[chatId].username = text;
            userSessions[chatId].step = 'password';
            bot.sendMessage(chatId, "🔒 Vui lòng nhập *mật khẩu* của bạn:", { parse_mode: 'Markdown' });
        } else if (session && session.step === 'password') {
            userSessions[chatId].password = text; // Lưu mật khẩu vào session

            const { username, password } = userSessions[chatId]; // Truy xuất thông tin từ session

            try {
                // Kiểm tra thông tin đăng nhập từ MongoDB
                const admin = await Admin.findOne({ username, password });


                if (admin) {
                    // Kiểm tra nếu chatId của người dùng trong cơ sở dữ liệu trùng với chatId hiện tại
                    if (String(admin.chatId) !== String(chatId)) {
                        bot.sendMessage(chatId, "❌ Bạn không có quyền truy cập hệ thống này.");
                    } else {
                        bot.sendMessage(chatId, "✅ Đăng nhập thành công! \n \n Chào mừng bạn quay lại! 🎉");
                        // Lưu thời gian đăng nhập vào mảng timeAt
                        admin.timeAt.push(new Date());
                        await admin.save();

                        userSessions[chatId] = null; // Xóa phiên làm việc sau khi đăng nhập
                    }

                } else {
                    bot.sendMessage(chatId, "❌ Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại.");
                    userSessions[chatId].step = 'username'; // Yêu cầu nhập lại tên đăng nhập
                }
            } catch (error) {
                console.error("Lỗi khi kiểm tra thông tin đăng nhập:", error.message);
                bot.sendMessage(chatId, "⚠️ Đã xảy ra lỗi khi kiểm tra thông tin đăng nhập. Vui lòng thử lại sau.");
            }
        }
    });

    console.log("Telegram bot is running");
};
