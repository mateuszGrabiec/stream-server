const express = require("express");
const socketIO = require("socket.io");
const http = require("http");

module.exports = class Server {

  constructor() {
    this.DEFAULT_PORT = 3000
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.io = socketIO(this.httpServer);
    this.speakerList = [];
    this.configureApp();
    this.handleRoutes();
    this.handleSocketConnection();
  }


  handleRoutes() {
    this.app.get("/", (req, res) => {
      res.send('hello');
    });
  }

  handleSocketConnection() {
    this.io.on("connection", socket => {
      socket.on("getSpeakers", () => {
        socket.emit("speakersList", this.speakerList)
      });

      socket.on("broadcaster", () => {
        if(!this.speakerList)this.speakerList=[]
        this.speakerList.push(socket.id);
        socket.broadcast.emit("broadcaster");
      });
      socket.on("watcher", (id) => {
        if (id) {
          socket.to(id).emit("watcher", socket.id);
        }
        else {
          //host is no longer streams
        }
      });

      socket.on("offer", (id, message) => {
        socket.to(id).emit("offer", socket.id, message);
      });

      socket.on("answer", (id, message) => {
        socket.to(id).emit("answer", socket.id, message);
      });

      socket.on("candidate", (id, message) => {
        socket.to(id).emit("candidate", socket.id, message);
      });

      socket.on("disconnect", () => {
        this.speakerList=this.speakerList.filter(s=>s!=socket.id)
        socket.broadcast.emit("endOfstream",socket.id)
      });

      socket.on("end", (id) => {
        this.speakerList=this.speakerList.filter(s=>s!=id)
        socket.broadcast.emit("endOfstream",id)
      });

    });
  }

  listen(callback) {
    this.httpServer.listen(this.DEFAULT_PORT, () =>
      callback(this.DEFAULT_PORT)
    );
  }

  configureApp() {
    const clientPath = `./public`;
    this.app.use(express.static(clientPath));
  }
}
