const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const server = http.createServer(app);
// Routes
const { BasicRouter } = require("./Router/BasicRouter");

const rooms = {};

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
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
      rooms[roomId] = { adminId: socket.id, users: [] };

      socket.emit("identifiedAdmin");
    } else {
      const adminID = rooms[roomId].adminId;
      io.to(adminID).emit("join_approval", {
        socketId: socket.id,
        userName: currrentuser,
      });
    }

    socket.on("aprove_user", ({ roomId, socketId }) => {
      console.log("this is approved user", roomId);
      io.to(socketId).emit("approved");
    });

    socket.on("final_join", ({ roomId }) => {
      socket.join(roomId);
      rooms[roomId].users.push(socket.id);
      console.log(rooms);
      io.to(roomId).emit("user_joined", { socketId: socket.id });
    });

    //to draw
    socket.on("draw", ({ roomId, x0, y0, x1, y1 }) => {
      console.log(roomId, x0, y0, x1, y1);
      io.to(roomId).emit("draw", { x0, y0, x1, y1 });
    });
  });
});

app.use("/", BasicRouter);

server.listen(8000, () => {
  console.log("server is listening to the port");
});
