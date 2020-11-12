var app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {'transports': ['websocket']});

var PORT = process.env.PORT || 3000;

var players={}
var sockets={}
var games={}

console.log(PORT);

app.get('/', function(req, res){
    res.sendFile('index.html');
  });

io.on('connection', client=>{
    // io.set('match origin protocol', true);
    client.emit('connected',{'id':client.id});
    console.log('Hello friend')
    
    client.on('checkUserDetail',data=>{
        var flag=false;
        for(var id in sockets){
            if(sockets[id].mobile_number === data.mobileNumber){
                flag=true
                break
            }
        }
        if (!flag) {  
            sockets[client.id] = {  
                mobile_number: data.mobileNumber,  
                is_playing: false,  
                game_id: null  
            };  
   
            var flag1 = false;  
            for (var id in players) {  
                if (id === data.mobileNumber) {  
                    flag1 = true;  
                    break;  
                }  
            }  
            if (!flag1) {  
                players[data.mobileNumber] = {  
                    played: 0,  
                    won: 0,  
                    draw: 0  
                };  
            }  
   
        }  
        client.emit('checkUserDetailResponse', !flag);  
    })

    client.on('getOpponents', data => {  
        var response = [];  
        for (var id in sockets) {  
            if (id !== client.id && !sockets[id].is_playing) {  
                response.push({  
                    id: id,  
                    mobile_number: sockets[id].mobile_number,  
                    played: players[sockets[id].mobile_number].played,  
                    won: players[sockets[id].mobile_number].won,  
                    draw: players[sockets[id].mobile_number].draw  
                });  
            }  
        }  
        client.emit('getOpponentsResponse', response);  
        client.broadcast.emit('newOpponentAdded', {  
            id: client.id,  
            mobile_number: sockets[client.id].mobile_number,  
            played: players[sockets[client.id].mobile_number].played,  
            won: players[sockets[client.id].mobile_number].won,  
            draw: players[sockets[client.id].mobile_number].draw  
        });  
    });

    
    client.on('selectOpponent', data => {  
        var response = { status: false, message: "Opponent is playing with someone else." };  
        if (!sockets[data.id].is_playing) {
            //generate random gameid  
            var gameId = uuidv4();  
            sockets[data.id].is_playing = true;  
            sockets[client.id].is_playing = true;  
            sockets[data.id].game_id = gameId;  
            sockets[client.id].game_id = gameId;  
            players[sockets[data.id].mobile_number].played = players[sockets[data.id].mobile_number].played + 1;  
            players[sockets[client.id].mobile_number].played = players[sockets[client.id].mobile_number].played + 1;  
   
            games[gameId] = {  
                player1: client.id,  
                player2: data.id,  
                whose_turn: client.id,  
                playboard: [["", "", ""], ["", "", ""], ["", "", ""]],  
                game_status: "ongoing", // "ongoing","won","draw"  
                game_winner: null, // winner_id if status won  
                winning_combination: []  
            };  
            games[gameId][client.id] = {  
                mobile_number: sockets[client.id].mobile_number,  
                sign: "x",  
                played: players[sockets[client.id].mobile_number].played,  
                won: players[sockets[client.id].mobile_number].won,  
                draw: players[sockets[client.id].mobile_number].draw  
            };  
            games[gameId][data.id] = {  
                mobile_number: sockets[data.id].mobile_number,  
                sign: "o",  
                played: players[sockets[data.id].mobile_number].played,  
                won: players[sockets[data.id].mobile_number].won,  
                draw: players[sockets[data.id].mobile_number].draw  
            };  
            io.sockets.connected[client.id].join(gameId);  
            io.sockets.connected[data.id].join(gameId);  
            io.emit('excludePlayers', [client.id, data.id]);  
            io.to(gameId).emit('gameStarted', { status: true, game_id: gameId, game_data: games[gameId] });  
   
        }  
    });
    
})
server.listen(PORT, function () {
    console.log('Server listening at port %d', PORT);
});
function uuidv4() {  
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {  
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);  
        return v.toString(16);  
    });  
} 