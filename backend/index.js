import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRouter from "./routes/userRouter.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authrouter from "./routes/authRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

dotenv.config({});

const PORT = process.env.PORT || 8000;
const app = express();
const httpServer = createServer(app);
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isLocalNetworkViteOrigin = (origin) => /^https?:\/\/(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}):5173$/.test(origin);
const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header are local tools such as curl.
    const allowLocalNetworkDevOrigin = process.env.NODE_ENV !== "production" && isLocalNetworkViteOrigin(origin);
    if (!origin || allowedOrigins.includes(origin) || allowLocalNetworkDevOrigin) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

app.get("/", (req, res) => {
  res.send("Server is working!");
});
// middlewares

app.use(
  cors(corsOptions),
);
app.use(express.json());
app.use(cookieParser());

const io = new Server(httpServer, {
  cors: corsOptions,
});
const onlineUsers = new Map();

const getTokenFromCookies = (cookies = "") =>
  cookies
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("token="))
    ?.slice("token=".length);

io.use((socket, next) => {
  try {
    const token = getTokenFromCookies(socket.handshake.headers.cookie);
    const { userId } = jwt.verify(token, process.env.JWT_SECRET_KEY);
    socket.userId = String(userId);
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.join(socket.userId);
  const userSockets = onlineUsers.get(socket.userId) || new Set();
  userSockets.add(socket.id);
  onlineUsers.set(socket.userId, userSockets);
  io.emit("onlineUsers", [...onlineUsers.keys()]);

  socket.on("disconnect", () => {
    const sockets = onlineUsers.get(socket.userId);
    sockets?.delete(socket.id);
    if (!sockets?.size) onlineUsers.delete(socket.userId);
    io.emit("onlineUsers", [...onlineUsers.keys()]);
  });

  // WebRTC media stays peer-to-peer. The server only relays the small offer,
  // answer and ICE-candidate messages needed to establish the connection.
  const relayCallSignal = (eventName) => {
    socket.on(eventName, ({ to, ...signal } = {}) => {
      if (typeof to !== "string" || !to) return;
      io.to(to).emit(eventName, { from: socket.userId, ...signal });
    });
  };

  relayCallSignal("call:offer");
  relayCallSignal("call:answer");
  relayCallSignal("call:ice-candidate");
  relayCallSignal("call:end");
  relayCallSignal("call:reject");
});

app.set("io", io);
app.use("/api/user", userRouter);
app.use("/api/auth", authrouter);
app.use("/api/messages", messageRouter);

app.use((error, req, res, next) => {
  if (error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Media files must be 25 MB or smaller" });
  }
  if (error) return res.status(400).json({ message: error.message || "Upload failed" });
  next();
});

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`server listen at ${PORT}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer();

export default function index() {}
