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
    origin: "https://scrriblelink.netlify.app/",
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
      rooms[roomId] = { adminId:{ id:socket.id,userName:currrentuser}, users: [] };
      console.log(rooms)

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
      console.log(username)
      rooms[roomId].users.push({id:socket.id,userName:username});
      // console.log(rooms);
      console.log(JSON.stringify(rooms, null, 10));
      io.to(roomId).emit("user_joined", { socketId: socket.id ,username});
    });

    //to draw
    socket.on("draw", ({ roomId, x0, y0, x1, y1 }) => {
      console.log(roomId, x0, y0, x1, y1);
      io.to(roomId).emit("draw", { x0, y0, x1, y1 });
    });
  });
});

app.use("/", BasicRouter);

server.listen(PORT, () => {
  console.log("server is listening to the port");
});
