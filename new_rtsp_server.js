var ws = require('ws');
var fs = require('fs');
var express = require('express');
var app = express();
var bodyParser = require("body-parser");

var STREAM_SECRET = "temp123", //ffmpeg 연결시 필요한 비밀번호
	STREAM_PORT =  8082, //ffmpeg 연결 포트
	WEBSOCKET_PORT = 8084, // 클라이언트 - 스트리밍 연결 (ws 연결 포트)
    SOCKETSERVER = 3001, //Web && 소캣 포트
    STREAM_FORMAT = process.argv[5] || 'binary'

var width = 1280, //해상도 지정 _ 카메라 컨트롤 요소 1
    height = 960;

var connectNum = [] //클라이언트 접속 정보 배열
var socketServer = new (ws.Server)({port: WEBSOCKET_PORT}); //websocket Server Create

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended : true
}));
app.use(express.static(__dirname + '/public'));
app.listen(SOCKETSERVER);
//SocketServer insert broadcast
socketServer.broadcast = function(data, opts) {
    for( var i = 0; i < connectNum.length ;i++) {
        if (connectNum[i].readyState) {
                    connectNum[i].send(data, opts);
        }
        else {
            console.log( 'Error: Client ('+i+') not connected.' );
        }
    }
};

socketServer.on('connection', function(socket) {
    // Send magic bytes and video size to the newly connected socket //최초 1회 소캣 연결시 스트리밍 기본정보
    // struct { char magic[4]; unsigned short width, height;}
    var streamHeader = new Buffer.alloc(32); //버퍼 할당
    streamHeader.write('jsmp'); //STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes
    streamHeader.writeUInt32BE(width, 4);
    streamHeader.writeUInt32BE(height, 6);
    socket.id = Math.floor(Math.random()*(10-1+1)) + 1; //난수 지정
    connectNum.push(socket);
    socket.send(streamHeader, {binary:true});

    console.log( 'New WebSocket Connection ('+socketServer.clients.size+' total)' );
    //console.log(socketServer.clients);
    socket.on('close', function(code, message){ //해당 sokcet을 배열에서 뺴줘야한다. 
        connectNum.splice(connectNum.indexOf(socket.id),1); // socket.id에 해당되는 요소 빼줌
        console.log( 'Disconnected WebSocket ('+socketServer.clients.size+' total)' );
    });
});
  
// HTTP Server to accept incomming MPEG Stream
var streamServer = require('http').createServer( function(request, response) {
    var params = request.url.substr(1).split('/');//접속경로 따져서 올바른 연결만 확인
    if( params[0] == STREAM_SECRET ) {
        // width = 1280;
        // height = 960;        
        console.log(
            'Stream Connected: ' + request.socket.remoteAddress +':' + request.socket.remotePort + ' size: ' + width + 'x' + height);
            request.on('data', function(date) {
                socketServer.broadcast(date, {binary: true});
            });
    }else {
        console.log('Failed Stream Connection: '+ request.socket.remoteAddress + request.socket.remotePort + ' - wrong secret.');
        response.end();
    }
}).listen(STREAM_PORT);
//app.listen(WEBPORT); //webserver
    
console.log('Listening for MPEG Stream on http://127.0.0.1:'+STREAM_PORT+'/<secret>/<width>/<height>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');
//console.log('Listening HTTP server on http://127.0.0.1:' + WEBPORT);
