var ws = require('ws');
var express = require('express');
var fs = require('fs');
var GPIO =require('onoff').Gpio//GPIO NO, input setting
var app = express();
var spawn = require("child_process").spawn;

var cam_GPIO_1 = new GPIO(4,"out"),
cam_GPIO_2 = new GPIO(17,"out"),
cam_GPIO_3 = new GPIO(18,"out"),
cam_GPIO_4 = new GPIO(22,"out"),
cam_GPIO_5 = new GPIO(23,"out"),
cam_GPIO_6 = new GPIO(9,"out"),
cam_GPIO_7 = new GPIO(25,"out");

//ex) cam_GPIO_1.writeSync(1) input 1 signal
// default setting in multi connect camera
cam_GPIO_1.writeSync(0);//GPIO_4
cam_GPIO_2.writeSync(1);//GPIO_17
cam_GPIO_3.writeSync(1);//GPIO_18
cam_GPIO_4.writeSync(1);//GPIO_22
cam_GPIO_5.writeSync(1);//GPIO_23
cam_GPIO_6.writeSync(1);//GPIO_9
cam_GPIO_7.writeSync(1);//GPIO_25


var STREAM_SECRET = "temp123", //ffmpeg 연결시 필요한 비밀번호
	STREAM_PORT =  8082, //ffmpeg 연결 포트
	WEBSOCKET_PORT = 8084, // 클라이언트 - 스트리밍 연결 (ws 연결 포트)
	WEBPORT = 8080,
    STREAM_FORMAT = process.argv[5] || 'binary', //사진 | 동영상 구분  ## base64 or binary
    STREAM_PID,  // Streaming에 사용중인 PID
    what_CAM = "No_cam";
      
var width = 1280, //해상도 지정 _ 카메라 컨트롤 요소 1
    height = 960;
var connectNum = []; //클라이언트 접속 정보 배열
    
// Websocket Server
var socketServer = new (ws.Server)({port: WEBSOCKET_PORT});
//SocketServer insert broadcast
socketServer.broadcast = function(data, opts) {
    for( var i = 0; i < connectNum.length ;i++) {
        if (connectNum[i].readyState) {
                if('base64' == STREAM_FORMAT) {
                    connectNum[i].send('data:image/jpeg;base64,' + data.toString('base64'), opts);
                }else{
                    connectNum[i].send(data, opts);
                    }
        }
        else {
            console.log( 'Error: Client ('+i+') not connected.' );
        }
    }
};
//select default camera
function default_camera(){
    what_CAM = "No_cam";
    cam_GPIO_1.writeSync(0);//GPIO_4
    cam_GPIO_2.writeSync(1);//GPIO_17
    cam_GPIO_3.writeSync(1);//GPIO_18
}
//select A camera
function A_camera(){
    what_CAM = "A";
    cam_GPIO_1.writeSync(0);//GPIO_4
    cam_GPIO_2.writeSync(0);//GPIO_17
    cam_GPIO_3.writeSync(1);//GPIO_18
}
//select B camera
function B_camera(){
    what_CAM = "B";
    cam_GPIO_1.writeSync(1);//GPIO_4
    cam_GPIO_2.writeSync(0);//GPIO_17
    cam_GPIO_3.writeSync(1);//GPIO_18
}
//select C camera
function C_camera(){
    what_CAM = "C";
    cam_GPIO_1.writeSync(0);//GPIO_4
    cam_GPIO_2.writeSync(1);//GPIO_17
    cam_GPIO_3.writeSync(0);//GPIO_18
}
//select D camera
function D_camera(){
    what_CAM = "D";
    cam_GPIO_1.writeSync(1);//GPIO_4
    cam_GPIO_2.writeSync(1);//GPIO_17
    cam_GPIO_3.writeSync(1);//GPIO_18
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended : true
}));
app.use(express.static(__dirname + '/public'));

socketServer.on('connection', function(socket) {
    // Send magic bytes and video size to the newly connected socket //최초 1회 소캣 연결시 전송해야할 데이터
    // struct { char magic[4]; unsigned short width, height;}
    var streamHeader = new Buffer.alloc(8); //버퍼 할당
    streamHeader.write('jsmp'); //STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes
    streamHeader.writeUInt16BE(width, 4);
    streamHeader.writeUInt16BE(height, 6);
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
    var params = request.url.substr(1).split('/');

    if( params[0] == STREAM_SECRET ) {
        // width = 1280;
        // height = 960;
        // broadcast data in base64 format
        if('base64' == STREAM_FORMAT) {
            var data = [], dataLen = 0;
            request.on('data', function (chunk) {
                console.log("chunk : "+chunk);
                data.push(chunk);
                dataLen += chunk.length;
            });

            request.on('end', function (chunk) {
                var buf = new Buffer.alloc(dataLen);
                for (var i = 0, len = data.length, pos = 0; i < len; i++) {
                    data[i].copy(buf, pos);
                    pos += data[i].length;
                }
                socketServer.broadcast(buf, {binary: false});
            });
        // broadcast data in binary format
        }else{
        console.log(
            'Stream Connected: ' + request.socket.remoteAddress +':' + request.socket.remotePort + ' size: ' + width + 'x' + height);
            request.on('data', function(date) {
                socketServer.broadcast(date, {binary: true});
            });
        }
    }else {
        console.log('Failed Stream Connection: '+ request.socket.remoteAddress + request.socket.remotePort + ' - wrong secret.');
        response.end();
    }
}).listen(STREAM_PORT);
app.listen(WEBPORT);
    
console.log('Listening for MPEG Stream on http://127.0.0.1:'+STREAM_PORT+'/<secret>/<width>/<height>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');
console.log('Listening HTTP server on http://127.0.0.1:' + WEBPORT);

// 스트림 시작   
app.post('/video',function(req,res){
    var bitrate = "1500k",
    fps = 30,
    quality = 20;
        
    var streamStart = [
        "-f","video4linux2",
        "-i","/dev/video0",
        "-f","mpeg1video",
        "-b:v", ""+bitrate,
        "-r",""+fps+"",
        "-q:v",""+quality+"",
        "-s",""+width+"x"+height,
        "-vf","mpdecimate",
        "http://127.0.0.1:"+STREAM_PORT+"/"+STREAM_SECRET+"/"
    ];
    function stream_start(){
        console.log("start camera");
        var videostreaming = spawn('ffmpeg',streamStart);
        STREAM_PID = videostreaming;
        videostreaming.stdout.on('data', function(data) {
            console.log('stdout: ' + data);
        });
        videostreaming.stderr.on('data', function(data) {
            console.log('stderr: ' + data);
        });
        videostreaming.on('exit', function(code) {
            console.log('exit: ' + code);
        });
    }
    if(STREAM_PID == undefined){ //현제 실행중인 스트리밍이 없다면
        if(req.body.Camera == "A"){
            A_camera(); // Select A_camera and start sub_process
            stream_start();
            res.writeHead(200, {"Content-Type": "text/html"});
            res.write("Start_A");
            res.end();
        }else if (req.body.Camera == "C"){
            C_camera() //Select C_camera and start sub_process
            stream_start();
            res.writeHead(200, {"Content-Type": "text/html"});
            res.write("Start_C");
            res.end();
        }else{
            res.writeHead(500, {"Content-Type": "text/html"});
            res.write("Wrong Name");
            res.end();
        }
    }else{ //현제 스트리밍이 실행중이라면
        if(req.body.Camera == "A"){
            console.log("Change Camera A")
            A_camera(); // Select A_camera and start sub_process
            res.writeHead(200, {"Content-Type": "text/html"});
            res.write("Start_A");
            res.end();
        }else if (req.body.Camera == "C"){
            console.log("Change Camera C")
            C_camera() //Select C_camera and start sub_process
            res.writeHead(200, {"Content-Type": "text/html"});
            res.write("Start_C");
            res.end();
        }else{
            res.writeHead(500, {"Content-Type": "text/html"});
            res.write("Wrong Name_Keep Camera");
            res.end();
        }
    }
});
//camera_contorl part 
app.post('/video_stop',function(){
    default_camera();
    STREAM_PID.kill(); //kill ffmpeg process
});
app.post('/pic',function(req,res){
    var cam_info =[
        "-w","1280",
        "-h","720",
        "-o","LecterRoom_pic.jpg",
        "-t","10",
        "-q","100"
    ]
    if(what_CAM == "No_cam"){ //카메라 사용유무 판단 사진찍기 전에 셋팅
        console.log("No Cam")
    }
    if(STREAM_PID == undefined){
        console.log("No Process")
    }else{
        STREAM_PID.kill(); //kill ffmpeg process
    }
                    
    default_camera(); //default C_camera
    C_camera(); //select C_camera

    var getting_gic =  spawn('raspistill',cam_info);
        getting_gic.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
        });
        getting_gic.stderr.on('data', function(data) {
            console.log('stderr: ' + data);
        });
        getting_gic.on('exit', function(code) {
        console.log('exit: ' + code);
        });
    fs.readFile('./LecterRoom_pic.jpg',function(err,data){
        var picdata = data
        if(err){
            console.log(err);
        }
        console.log("send!!");
        res.writeHead(200, {"Content-Type": "image/jpg"});
        res.write(picdata);
        res.end();
    })    
})
app.post('/pic_1',function(req,res){
    var cam_info =[
        "-w","1280",
        "-h","720",
        "-o","LecterRoom_pic.jpg",
        "-t","10",
        "-q","100"
    ]
    

    if(what_CAM == "No_cam"){ //카메라 사용유무 판단 사진찍기 전에 셋팅
        console.log("No Cam")
    }
    if(STREAM_PID == undefined){
        console.log("No Process")
    }else{
        var promise = STREAM_PID.kill(); //kill ffmpeg process
        var childProcess = promise.childProcess;
        childProcess.stdout.on('data',function(data){
            console.log("kill process_"+data);
        })
        childProcess.stderr.on('data',function(data){
            console.log("kiil err :"+data);
        })

        promise.then(function(){
            default_camera(); //default C_camera
            C_camera(); //select C_camera

            var getting_gic =  spawn('raspistill',cam_info);
            getting_gic.stdout.on('data', function(data) {
                console.log('stdout: ' + data);
            });
            getting_gic.stderr.on('data', function(data) {
                console.log('stderr: ' + data);
            });
            getting_gic.on('exit', function(code) {
                console.log('exit: ' + code);
            });
            fs.readFile('./LecterRoom_pic.jpg',function(err,data){
                var picdata = data
                if(err){
                    console.log(err);
                }
                console.log("send!!");
                res.writeHead(200, {"Content-Type": "image/jpg"});
                res.write(picdata);
                res.end();
            })    
        })
    }
                    
    default_camera(); //default C_camera
    C_camera(); //select C_camera

    var getting_gic =  spawn('raspistill',cam_info);
        getting_gic.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
        });
        getting_gic.stderr.on('data', function(data) {
            console.log('stderr: ' + data);
        });
        getting_gic.on('exit', function(code) {
        console.log('exit: ' + code);
        });
    fs.readFile('./LecterRoom_pic.jpg',function(err,data){
        var picdata = data
        if(err){
            console.log(err);
        }
        console.log("send!!");
        res.writeHead(200, {"Content-Type": "image/jpg"});
        res.write(picdata);
        res.end();
    })    
})