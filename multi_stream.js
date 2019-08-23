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
//라즈베리파이와 연결할 스트림 포트 생성 요청 post
app.post("/stream",function(req,res){ //cl->1.스트리밍 요청
    //1.교수가 실시간 스트리밍을 누름
    //2.해당 강의실의 정보를 얻음(강의실) //쿼리__ 
    //3.라즈베리파이의 상태(현제 스트리밍실행유무)--이름과 카메라 종류 req__
    //4. 상태값에 따른 요청(req_post)--stream _true{스트림중일떄}, _false{스트림안할때}
    //* 스트림안할때
    //# 포트 범위 10개 8000~8010 까지 생성 using_portArr = new Array(10);
    //
    
    // 대기 포트 초기화 -모 
for(var i=0;i<10;i++){
    using_portArr[i].port = 8000 + i; //포트
    using_portArr[i].state = false; //사용유무
    using_portArr[i].Room = "voidRoom"; //사용강의실정보
    using_portArr[i].process = {}; //사용중인 스트림서버 PID객체
    using_portArr[i].processPID = 0; //사용중인 스트림서버 PID번호
    using_portArr[i].member = [] //영상을 보기 원하는 connection 정보
}

// 초기화된 객체에 요청이 들어올때마다 갱신해야함 (요청에 따른 데이터 갱신 필요)

//빈포트 찾고 스트림 생성- 스트림이 없을 때 
for(var i=0;i<10;i++){
    if(using_portArr[i].state == false){
        using_portArr[i].state = true;
        var videostreaming = spawn('node',[stream_fun.js,using_portArr[i].port]);
        var childProcess = videostreaming.childProcess;
        using_portArr[i].process = childProcess
        childProcess.stdout.on('data', function(data) {
            if(typeof(data) == "object"){
                for(var j=0;j<10;j++){
                    if(using_portArr[h].processPID == childProcess.pid){
                        console.log('stdout: ' + data); //자식프로세서에서 데이터 넘어 올떄마다 클라이언트에 맞춰서 데이터 전송해야함
                        socketServer.broadcast(data, {binary: true},using_portArr[j].member)
                    }
                }
            }
        });
        childProcess.stderr.on('data', function(data) {
            console.log('stderr: ' + data);
        });
    break;
    }
}
// 위에 유저가 접속했을 때 유저 정보 포트에 추가하는 코드 아직 추가 안함
// 스트림이 존재할 때 해당 유저를 포트 member에 추가  
for(var i=0;i<10;i++){
    if(using_portArr[i].Room == req.body.Room){ // req로 해당 강의실정보
        using_portArr[i].member.push(socket); // 주의 코드
    }
}
//이어서 라즈베리에 스트리밍 요청
// 빈포트 찾고 스트림 생성- 스트림이 있을 때
//5. 스트리밍중이 아니라면 연결할 mpeg서버 생성
//6. mpeg서버의 포트와 스트리밍 시작 요청
//7. 스트리밍 연결
//8. mpeg ws의 포트를 웹클라이언트에 전송
    
    //각 강의실에 대한 카메라 상태 체크 필요
    //상태에 따른 동작 작성
    //상태에 따른 데이터 시나리오 작성
})
app.post("/",function(req,res){ //강의실 - PI아이피 - 카메라(A or C)가 매칭 되어야함
  
})
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
//클라이언트 연결단
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


//라즈베리 연결단
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

    

console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');

