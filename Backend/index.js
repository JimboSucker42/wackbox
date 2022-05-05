const { debug } = require('console');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const { MongoClient } = require('mongodb');
const db = new MongoClient('mongodb://localhost:27017/');
db.connect();
var main = db.db('wackbox');
var games = main.collection('games')


const io = new Server(server, {  
    cors: {  origin: "*", methods: ["GET", "POST"]}
});


app.get('/*', (req, res) => {
    switch (req.url) {
        case "/join":
            res.sendFile(__dirname + "/html/join/index.html");
            break;
        case "/host":
            res.sendFile(__dirname + "/html/host/index.html");
            break;
        default:
            res.sendFile(__dirname + "/html/join/index.html");
            break;
    }
});

io.on('connection', (socket) => {
    //host
    socket.on('hostRoom', function(game,name){
        generateRoom(game, name, socket)
    })
    //join
    socket.on('joinGame', function(code,name){
      if(code != "/"){
        if(joinRoom(code,name,socket)){
            socket.join(code);
            
        }
        
      }
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

//initialises server
server.listen(8080, () => {
    console.log('listening on *:8080');
});

function generateRoom(game, name, socket){
    var code = randomChars(4);
    switch (game) {
        default:
            console.log(name)
            games.insertOne({code:code, players:[{name:name, id:socket.id}]}, (err,result)=>{
                socket.join(code);
                socket.emit('switchRoom', code);
            })
            break;
    }
}
function joinRoom(code, name, socket){
    games.findOne({code:code}, (err,res)=>{
        if(err) console.log(err)
        socket.join(code);
        res.updateOne({players:[{name:name, id:socket.id}]}, (err,result)=>{
            console.log(result)
        })
        return true;
    })
    return false;
}

//tools
function randomChars(amount){
    var val = ""
    var chars = "abcdefghijklmnopqrstuvwxyz"
    for (let i = 0; i < amount; i++) {
        var rand = Math.floor(Math.random()*24)
        val += chars[rand]
    }
    return val;
}

function get(table, query){
    return new Promise((resolve)=>{
        table.findOne(query, (err,result)=>{
            if(err) console.log(err)
            resolve(result)
        })
    })
}

function insert(table, value){
    return new Promise((resolve)=>{
        table.insertOne(value, (err,result)=>{
            console.log(err)
            resolve(result)
        })
    })
}