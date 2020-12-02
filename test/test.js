const { expect } = require('chai');
var chai = require('chai');
var should = chai.should();
var io = require('socket.io-client');

// let socketURL = "http://localhost:3000/";
let socketURL = "https://checkers-server.azurewebsites.net/";
const PORT = process.env.PORT || 3000;

describe("Initial connection", function () {
  
  var client, client2;

  beforeEach('user connected through socket.', function (done) {
    client = io.connect(socketURL, { 'transports': ['websocket'], 'match origin protocol': true });
    client.on('connected', function (data) {
      client2 = io.connect(socketURL, { 'transports': ['websocket'], 'match origin protocol': true });
      client2.on('connected', function (data) {
        done();
      });
    });
  });

  describe("Echo testing hello world", function () {
    it('receive msg through socket.', function (done) { 
      client.emit('echo', {"msg": "Hello server"});
      client.on('msg', (data) => {
        expect(data.msg).to.equal("Hello World");
        done();
      });
    });
  });

  // describe("Echo testing hello world", function () {
  //   it('receive msg through socket.', function (done) { 
  //     client.emit('echo', {"msg": "Hello server"});
  //     client.on('msg', (data) => {
  //       expect(data.msg).to.equal("Hello World");
  //       done();
  //     });
  //   });
  // });

});
