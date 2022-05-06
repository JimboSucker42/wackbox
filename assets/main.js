var socket = io();


socket.on('connect',()=>{
  if((window.location.pathname).substring(1,6) == 'lobby'){
    socket.emit('updatePlayers', (window.location.pathname).substring(7,11));
  }

  if(sessionStorage.socket == null){
    sessionStorage.socekt = socket;
    socket.emit('setId', socket);
  }else{
    socket.emit('setId', sessionStorage.socket);
  }
});

socket.on("open", (code)=>{
  console.log('directed')
  window.location.href = '/lobby/'+code
})

socket.on('players', (players)=>{
  console.log('update')
  for (let i = 0; i < players.length; i++) {
    var index = document.createElement("div");
    index.innerText = players[i].name
    document.getElementById('players').appendChild(index) 
  }
})