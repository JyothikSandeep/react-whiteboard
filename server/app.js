const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const server = http.createServer(app);
const path = require('path');

// Routes
require('dotenv').config();

const PORT = process.env.PORT || 8000;

const { BasicRouter } = require("./Router/BasicRouter");

const rooms = {};

app.use(cors());
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

const io = new Server(server, {
  cors: {
    origin: ["https://cts-vibeappce21203-2.azurewebsites.net","https://scrriblelink.netlify.app","http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User id connected ", socket.id);

  socket.on("disconnect", () => {
    console.log("connection is disconnected", socket.id);
  });

  socket.on("join_room_request", ({ roomId, currrentuser }) => {
    console.log("joined in a room", socket.id, currrentuser);

    if (!rooms[roomId]) {
      socket.join(roomId);
      rooms[roomId] = { adminId:{ id:socket.id,userName:currrentuser}, users: [{id: socket.id, userName: currrentuser}], pages: [0], drawings: {}, pinnedPageId: 0 };
      io.to(roomId).emit("user_list", { users: rooms[roomId].users });
      socket.emit("pages_list", { pages: rooms[roomId].pages });
      socket.emit("pinned_page", { pinnedPageId: rooms[roomId].pinnedPageId });
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
      // Send the full pages list to the new user
      if (rooms[roomId].pages && rooms[roomId].pages.length > 0) {
        socket.emit("pages_list", { pages: rooms[roomId].pages });
      }
      // Send the current pinned page to the new user
      if (typeof rooms[roomId].pinnedPageId !== 'undefined') {
        socket.emit("pinned_page", { pinnedPageId: rooms[roomId].pinnedPageId });
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

    // Pin a page
    socket.on("pin_page", ({ pageId }) => {
      rooms[roomId].pinnedPageId = pageId;
      io.to(roomId).emit("pinned_page", { pinnedPageId: pageId });
    });

    // New page creation
    socket.on("new_page", ({ pageId }) => {
      if (!rooms[roomId].pages) rooms[roomId].pages = [0];
      if (!rooms[roomId].pages.includes(pageId)) {
        rooms[roomId].pages.push(pageId);
      }
      io.to(roomId).emit("pages_list", { pages: rooms[roomId].pages });
    });

    //to draw
    socket.on("draw", ({ pageId, x0, y0, x1, y1, userName }) => {
      // Store the drawing action for this page
      if (!rooms[roomId].drawings) rooms[roomId].drawings = {};
      if (!rooms[roomId].drawings[pageId]) rooms[roomId].drawings[pageId] = [];
      rooms[roomId].drawings[pageId].push({ x0, y0, x1, y1, userName });
      // Broadcast as before
      io.emit("draw", { x0, y0, x1, y1, pageId, userName });
    });

    // Clear server-side drawing data for a page
    socket.on("clear-page-drawing", ({ pageId }) => {
      if (rooms[roomId] && rooms[roomId].drawings && rooms[roomId].drawings[pageId]) {
        rooms[roomId].drawings[pageId] = [];
      }
      // Broadcast to all clients to clear the board visually
      io.emit("clear-board", { pageId });
    });

    // Serve full drawing for a page
    socket.on("get_page_drawing", ({ pageId }) => {
      if (!rooms[roomId].drawings) rooms[roomId].drawings = {};
      const actions = rooms[roomId].drawings[pageId] || [];
      socket.emit("page_drawing", { pageId, actions });
    });

    // Collaborative clear-board
    socket.on("clear-board", ({ pageId }) => {
      io.emit("clear-board", { pageId });
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
    socket.on("cursor-move", ({ pageId, x, y, userName, userId }) => {
      io.emit("cursor-move", { pageId, x, y, userName, userId });
    });
  });
});

// app.all('/{*any}', (req, res, next) => {})
app.use("/test", BasicRouter);

server.listen(PORT, () => {
  console.log("server is listening to the port",PORT);
});
