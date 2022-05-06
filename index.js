const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://mainACC:Dawnds30@cluster0.1vgra.mongodb.net/wackbox?retryWrites=true&w=majority";
const db = new MongoClient(uri, {useUnifiedTopology: true,  useNewUrlParser: true });
var main, games;
db.connect(() => {
    main = db.db('wackbox');
    games = main.collection('games')
    players = main.collection('players')
    console.log("connected to mongo")
});
const io = new Server(server, {  
    cors: {  origin: "*", methods: ["GET", "POST"]}
});

//routing
app.use('/',express.static(__dirname + "/html/join/"))
app.use('/join', express.static(__dirname + "/html/join/"));
app.use('/host', express.static(__dirname + "/html/host/"))
app.use('/lobby/*', express.static(__dirname + "/html/lobby/"))

app.use(express.static(__dirname + '/assets'));


io.on('connection', (socket) => {
    //setup
    socket.on('setId', (sock)=>{
        socket = sock;
    })
    //host
    socket.on('hostRoom', function(game,name){
        generateRoom(game, name, socket)
    })
    //join
    socket.on('joinGame', (code,name)=>{
        joinRoom(code,name,socket)
    });
    //game
    socket.on('updatePlayers', (code)=>{
        console.log(code)
        get(games, {code:code}).then((res)=>{
            for (let i = 0; i < io.allSockets.length; i++) {
                
            }
            io.to(code).emit('players', res.players)
        })
    })
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

//initialises server
server.listen(8080, () => {
    console.log('listening on *:8080');
});
//game funcitons
function generateRoom(game, name, socket){
    var code = randomChars(4);
    switch (game) {
        default:
            console.log(name + " has started game " + code)
            insert(games, {code:code, players:[{name:name, id:socket.id}]}).then(()=>{
                socket.join(code);
                socket.emit('open', code);
            })
            break;
    }
}
function joinRoom(code, name, socket){
    var query = {code:code}
    var value = { $push:{players: {name:name, id:socket.id}} }
    games.updateOne(query,value, (err,res)=>{
        if(err) console.log(err)
        socket.join(code);
        socket.emit('open', code);
    })
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
            resolve(result)
        })
    })
}