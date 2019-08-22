var ws = require('ws');
var fs = require('fs');
var express = require('express');
var app = express();
var bodyParser = require("body-parser");
const hbjs = require('handbrake-js')

var STREAM_SECRET = "temp123", //ffmpeg 연결시 필요한 비밀번호
	STREAM_PORT =  8082, //ffmpeg 연결 포트
	WEBSOCKET_PORT = 8084, // 클라이언트 - 스트리밍 연결 (ws 연결 포트)
    SOCKETSERVER = 3001, //Web && 소캣 포트
    STREAM_FORMAT = process.argv[5] || 'binary'

var width = 1280, //해상도 지정 _ 카메라 컨트롤 요소 1
    height = 960;



    var connectNum = [], //클라이언트 접속 정보 배열
    connectGroup =[];

var socketServer = new (ws.Server)({port: WEBSOCKET_PORT}); //websocket Server Create

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended : true
}));
app.use(express.static(__dirname + '/public'));
app.listen(SOCKETSERVER); //webpage_access port
//SocketServer insert broadcast
socketServer.broadcast = function(data, opts,connectGroup) {//stream2. 해당되는 
    for( var i = 0; i < connectGroup.length ;i++) {
        if (connectGroup[i].readyState) {
                connectGroup[i].send(data, opts);
        }
        else {
            console.log( 'Error: Client ('+i+') not connected.' );
        }
    }
};

socketServer.on('connection', function(socket) {
    // Send magic bytes and video size to the newly connected socket //최초 1회 소캣 연결시 스트리밍 기본정보
    var streamHeader = new Buffer.alloc(8); //버퍼 할당
    streamHeader.write('jsmp'); //STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes
    streamHeader.writeUInt16BE(width, 4);
    streamHeader.writeUInt16BE(height, 6);
    socket.id = Math.floor(Math.random()*(10-1+1)) + 1; //cli 사용자 아이디 설정
    connectGroup.push(socket);// 해당 스트림과 연결될 cli 정보 connect to mpeg stream
    // 요청하는 스트림이 무엇인지 어떻게 데이터를 받을 것인가?
    socket.send(streamHeader, {binary:true});

    console.log( 'New WebSocket Connection ('+socketServer.clients.size+' total)' );
    //console.log(socketServer.clients);
    socket.on('close', function(code, message){ //해당 sokcet을 배열에서 뺴줘야한다. 
        connectGroup.splice(connectGroup.indexOf(socket.id),1); // socket.id에 해당되는 요소 빼줌
        console.log( 'Disconnected WebSocket ('+socketServer.clients.size+' total)' );
    });
});



// HTTP Server to accept incomming MPEG Stream
var streamServer = require('http').createServer( function(request, response) {
    var params = request.url.substr(1).split('/');//접속경로 따져서 올바른 연결만 확인
    console.log("params[1] : "+params[0]+" : "+JSON.stringify(request))
    if( params[0] == STREAM_SECRET ) {
        // width = 1280;
        // height = 960;
        fs.writeFile('./test.mpg','w',()=>{ //fs1.파일을 만든다.쓰기전용
            console.log("open to file")
        })
        var writeStream = fs.createWriteStream('./test.mpg'); //fs2.해당 파일을 쓰기전용 스트림과 연결
        
        console.log(
            'Stream Connected: ' + request.socket.remoteAddress +':' + request.socket.remotePort + ' size: ' + width + 'x' + height);
            request.on('data', function(data) {
                writeStream.write(data); //fs3. 데이터 흐름 연결
                socketServer.broadcast(data, {binary: true},request.socket.remoteAddress); //stream1.해당되는 PI에서 데이터가 넘어옴
            });
            request.on('end',()=>{
                console.log('stream connection done')
                writeStream.end(()=>{
                    console.log("write Done")
                    writeStream.end();//fs4.쓰기전용스트림 종료
                    hbjs.spawn({ input: 'test.mpg', output: 'test1.mp4' })//fs5.파일 정제 및 mp4 인코딩
                        .on('error', err => {
                            // invalid user input, no video found etc
                        })
                        .on('progress', progress => {
                            console.log(
                            'Percent complete: %s, ETA: %s',
                            progress.percentComplete,
                            progress.eta
                            )
                        })
                        .on('end',()=>{
                            console.log("convert mp4 file"); //fs6.끝
                        })
                })
            })
    }else {
        console.log('Failed Stream Connection: '+ request.socket.remoteAddress + request.socket.remotePort + ' - wrong secret.');
        response.end();
    }
}).listen(STREAM_PORT);

    
console.log('Listening for MPEG Stream on http://127.0.0.1:'+STREAM_PORT+'/<secret>/<width>/<height>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');

