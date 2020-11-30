// var server = require('express')();
// const server = require('http').createServer(app);
// const io = require('socket.io')(server, {'transports': ['websocket']});

const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html'

var players={}
var sockets={}
var games={}

console.log(PORT);

const server = express()
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server, {'transports': ['websocket']});

io.on('connection', client =>{
    // io.set('match origin protocol', true);
    client.on('echo', data => {
        client.emit('msg', {'msg':'Hello World'})
    });

    client.emit('connected',{'id':client.id});
    console.log(`Hello friend ${client.id}`);
    
    client.on('checkUserDetail', data=>{
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
        // console.log("selectOpponent", data);
        
        var response = { status: false, message: "Opponent is playing with someone else." };  
        if (typeof sockets[data.id] != "undefined" && !sockets[data.id].is_playing) {
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
            client.join(gameId);
            io.sockets.sockets.get(data.id).join(gameId);  
            io.emit('excludePlayers', [client.id, data.id]);  
            io.to(gameId).emit('gameStarted', { status: true, game_id: gameId, game_data: games[gameId] });              

        }  
    });

    client.on('selectCell', data => {

        console.log("selectCell " + data.gameState);
        // games[data.gameId].playboard[data.i][data.j] = games[data.gameId][games[data.gameId].whose_turn].sign;

        // var isDraw = true;
        // for (let i = 0; i < 3; i++) {
        //     for (let j = 0; j < 3; j++) {
        //         if (games[data.gameId].playboard[i][j] == "") {
        //             isDraw = false;
        //             break;
        //         }
        //     }
        // }
        // if (isDraw)
        //     games[data.gameId].game_status = "draw";


        // for (let i = 0; i < winCombinations.length; i++) {
        //     var tempComb = games[data.gameId].playboard[winCombinations[i][0][0]][winCombinations[i][0][1]] + games[data.gameId].playboard[winCombinations[i][1][0]][winCombinations[i][1][1]] + games[data.gameId].playboard[winCombinations[i][2][0]][winCombinations[i][2][1]];
        //     if (tempComb === "xxx" || tempComb === "ooo") {
        //         games[data.gameId].game_winner = games[data.gameId].whose_turn;
        //         games[data.gameId].game_status = "won";
        //         games[data.gameId].winning_combination = [[winCombinations[i][0][0],  winCombinations[i][0][1]], [winCombinations[i][1][0], winCombinations[i][1][1]], [winCombinations[i][2][0], winCombinations[i][2][1]]];
        //         players[games[data.gameId][games[data.gameId].game_winner].mobile_number].won++;
        //     }
        // }
        // if (games[data.gameId].game_status == "draw") {
        //     players[games[data.gameId][games[data.gameId].player1].mobile_number].draw++;
        //     players[games[data.gameId][games[data.gameId].player2].mobile_number].draw++;
        // }
        games[data.gameId].whose_turn = games[data.gameId].whose_turn == games[data.gameId].player1 ? games[data.gameId].player2 : games[data.gameId].player1;
        io.to(data.gameId).emit('selectCellResponse', {gameData: games[data.gameId], gameState: data.gameState, playerId: data.playerId});

        // if (games[data.gameId].game_status == "draw" || games[data.gameId].game_status == "won") {
        //     gameBetweenSeconds = 10;
        //     gameBetweenInterval = setInterval(() => {
        //         gameBetweenSeconds--;
        //         io.to(data.gameId).emit('gameInterval', gameBetweenSeconds);
        //         if (gameBetweenSeconds == 0) {
        //             clearInterval(gameBetweenInterval);

        //             var gameId = uuidv4();
        //             sockets[games[data.gameId].player1].game_id = gameId;
        //             sockets[games[data.gameId].player2].game_id = gameId;
        //             players[sockets[games[data.gameId].player1].mobile_number].played = players[sockets[games[data.gameId].player1].mobile_number].played + 1;
        //             players[sockets[games[data.gameId].player2].mobile_number].played = players[sockets[games[data.gameId].player2].mobile_number].played + 1;

        //             games[gameId] = {
        //                 player1: games[data.gameId].player1,
        //                 player2: games[data.gameId].player2,
        //                 whose_turn: games[data.gameId].game_status == "won" ? games[data.gameId].game_winner : games[data.gameId].whose_turn,
        //                 playboard: [["", "", ""], ["", "", ""], ["", "", ""]],
        //                 game_status: "ongoing", // "ongoing","won","draw"
        //                 game_winner: null, // winner_id if status won
        //                 winning_combination: []
        //             };
        //             games[gameId][games[data.gameId].player1] = {
        //                 mobile_number: sockets[games[data.gameId].player1].mobile_number,
        //                 sign: "x",
        //                 played: players[sockets[games[data.gameId].player1].mobile_number].played,
        //                 won: players[sockets[games[data.gameId].player1].mobile_number].won,
        //                 draw: players[sockets[games[data.gameId].player1].mobile_number].draw
        //             };
        //             games[gameId][games[data.gameId].player2] = {
        //                 mobile_number: sockets[games[data.gameId].player2].mobile_number,
        //                 sign: "o",
        //                 played: players[sockets[games[data.gameId].player2].mobile_number].played,
        //                 won: players[sockets[games[data.gameId].player2].mobile_number].won,
        //                 draw: players[sockets[games[data.gameId].player2].mobile_number].draw
        //             };
        //             io.sockets.connected[games[data.gameId].player1].join(gameId);
        //             io.sockets.connected[games[data.gameId].player2].join(gameId);
            
        //             io.to(gameId).emit('nextGameData', { status: true, game_id: gameId, game_data: games[gameId] });
        //             io.sockets.connected[games[data.gameId].player1].leave(data.gameId);
        //             io.sockets.connected[games[data.gameId].player2].leave(data.gameId);
        //             delete games[data.gameId];
        //         }
        //     }, 1000);
        // }

    });

    // ------- LAST STEP ----------

    client.on('disconnect', () => {
        console.log("disconnect : " + client.id);
        if (typeof sockets[client.id] != "undefined") {
            if (sockets[client.id].is_playing) {
            
                io.to(sockets[client.id].game_id).emit('opponentLeft', {});
                players[sockets[games[sockets[client.id].game_id].player1].mobile_number].played--;
                players[sockets[games[sockets[client.id].game_id].player2].mobile_number].played--;
                io.sockets.sockets.get(client.id == games[sockets[client.id].game_id].player1 ? games[sockets[client.id].game_id].player2 : games[sockets[client.id].game_id].player1).leave(sockets[client.id].game_id);
                sockets[games[sockets[client.id].game_id].player1].is_playing = false;
                sockets[games[sockets[client.id].game_id].player2].is_playing = false;
                delete games[sockets[client.id].game_id];
            }
        }
        delete sockets[client.id];
        client.broadcast.emit('opponentDisconnected', {
            id: client.id
        });
    });
    
})
