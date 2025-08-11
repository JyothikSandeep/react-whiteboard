const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const server = http.createServer(app);
// Routes
require('dotenv').config();

const PORT = process.env.PORT || 8000;

const { BasicRouter } = require("./Router/BasicRouter");

const rooms = {};

const io = new Server(server, {
  cors: {
    origin: ["https://scrriblelink.netlify.app","http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});
app.use(cors());

io.on("connection", (socket) => {
  console.log("User id connected ", socket.id);

  socket.on("disconnect", () => {
    console.log("connection is disconnected", socket.id);
  });

  socket.on("join_room_request", ({ roomId, currrentuser }) => {
    console.log("joined in a room", socket.id, currrentuser);

    if (!rooms[roomId]) {
      socket.join(roomId);
      rooms[roomId] = { adminId:{ id:socket.id,userName:currrentuser}, users: [{id: socket.id, userName: currrentuser}] };
      io.to(roomId).emit("user_list", { users: rooms[roomId].users });
      socket.emit("identifiedAdmin");
    } else {
      const adminID = rooms[roomId].adminId.id;
      console.log(rooms);
      io.to(adminID).emit("join_approval", {
        socketId: socket.id,
        userName: currrentuser,
      });
    }

    socket.on("aprove_user", ({ roomId, socketId ,username}) => {
      console.log("this is approved user", roomId,username);
      io.to(socketId).emit("approved",{username});
    });

    socket.on("final_join", ({ roomId,username }) => {
      socket.join(roomId);
      if (!rooms[roomId].users.some(u => u.id === socket.id)) {
        rooms[roomId].users.push({id:socket.id,userName:username});
      }
      io.to(roomId).emit("user_joined", { socketId: socket.id ,username});
      io.to(roomId).emit("user_list", { users: rooms[roomId].users });
    });

    // Send user list on request
    socket.on("get_users", ({ roomId }) => {
      if (rooms[roomId]) {
        socket.emit("user_list", { users: rooms[roomId].users });
      }
    });

    // Remove user on disconnect and update user list
    socket.on("disconnect", () => {
      for (const rId in rooms) {
        const before = rooms[rId].users.length;
        rooms[rId].users = rooms[rId].users.filter(u => u.id !== socket.id);
        if (rooms[rId].users.length !== before) {
          io.to(rId).emit("user_list", { users: rooms[rId].users });
        }
      }
    });

    //to draw
    socket.on("draw", ({ roomId, x0, y0, x1, y1 }) => {
      console.log(roomId, x0, y0, x1, y1);
      io.to(roomId).emit("draw", { x0, y0, x1, y1 });
    });

    // Collaborative clear-board
    socket.on("clear-board", ({ roomId }) => {
      io.to(roomId).emit("clear-board");
    });

    // Chat message
    socket.on("chat_message", ({ roomId, ...msg }) => {
      io.to(roomId).emit("chat_message", msg);
    });

    // --- WebRTC signaling relay ---
    socket.on("webrtc-offer", ({ roomId, to, from, offer }) => {
      socket.to(to).emit("webrtc-offer", { from, offer });
    });
    socket.on("webrtc-answer", ({ roomId, to, from, answer }) => {
      socket.to(to).emit("webrtc-answer", { from, answer });
    });
    socket.on("webrtc-ice", ({ roomId, to, from, candidate }) => {
      socket.to(to).emit("webrtc-ice", { from, candidate });
    });

    //cursur move
    socket.on("cursor-move", ({ roomId, x, y, userName, userId }) => {
      io.to(roomId).emit("cursor-move", { x, y, userName, userId });
    });
  });
});

app.use("/", BasicRouter);

server.listen(PORT, () => {
  console.log("server is listening to the port");
});
