const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const bookingRoutes = require("./routes/bookingRoutes");
const initTelegramBot = require("./telegram/bot");

dotenv.config();

const app = express();

// Đọc chứng chỉ SSL từ file (HTTPS)
const sslOptions = {
  key: fs.readFileSync(path.resolve(__dirname, process.env.SSL_KEY_PATH)),
  cert: fs.readFileSync(path.resolve(__dirname, process.env.SSL_CERT_PATH)),
};

// Tạo server HTTPS
const server = https.createServer(sslOptions, app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Lưu instance của io vào app để sử dụng trong routes
app.set("io", io);

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // Thoát chương trình nếu không kết nối được
  }
};

// Khởi động bot Telegram
initTelegramBot(io);

// Routes
app.use("/api", bookingRoutes);

// Socket.IO
io.on("connection", (socket) => {
  console.log("🔗 New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Khởi động server
const PORT = process.env.PORT || 443;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server is running on https://localhost:${PORT}`);
  });
});
