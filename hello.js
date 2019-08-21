var ws = require('ws');
var express = require('express');
var GPIO =require('onoff').Gpio,//GPUO No
    cam_GPIO_1 = new GPIO(4,"out"),
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
    what_CAM = "A";  
//select default camera
function default_camera(){
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

  
    var app = express();

    app.use(express.static(__dirname + '/public'));
    
    var width = 640, //해상도 지정 _ 카메라 컨트롤 요소 1
        height = 480;
    var connectNum = []; //클라이언트 접속 정보 배열
    
    // Websocket Server
    var socketServer = new (ws.Server)({port: WEBSOCKET_PORT});
    socketServer.on('connection', function(socket) {
        // Send magic bytes and video size to the newly connected socket //최초 1회 소캣 연결시 전송해야할 데이터
        // struct { char magic[4]; unsigned short width, height;}
        var streamHeader = new Buffer.alloc(8);
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
    
    
    // HTTP Server to accept incomming MPEG Stream
    var streamServer = require('http').createServer( function(request, response) {
        var params = request.url.substr(1).split('/');
    
        if( params[0] == STREAM_SECRET ) {
            width = (640)|0;
            height = (480)|0;
        console.log("data"+Object.keys(request));	
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
                        'Stream Connected: ' + request.socket.remoteAddress +
                        ':' + request.socket.remotePort + ' size: ' + width + 'x' + height
                );
    
                request.on('data', function(date) {
                    socketServer.broadcast(date, {binary: true});
                });
            }
        }else {
            console.log(
                'Failed Stream Connection: '+ request.socket.remoteAddress + 
                request.socket.remotePort + ' - wrong secret.'
            );
            response.end();
        }
    
    }).listen(STREAM_PORT);
    app.listen(WEBPORT);
    
    console.log('Listening for MPEG Stream on http://127.0.0.1:'+STREAM_PORT+'/<secret>/<width>/<height>');
    console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');
    console.log('Listening HTTP server on http://127.0.0.1:' + WEBPORT);
    
    var exec = require("child_process").exec;
    var spawn = require("child_process").spawn;
    // 스트림 시작
    var bitrate = "500k",
        fps = 21,
         quality = 10;
    
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
        A_camera(); // Select A_camera and start sub_process
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
        console.log(videostreaming.pid);
    }
    app.get('/start',function(){
        stream_start()
    });
    
    //camera_contorl part 
    app.get('/hello',function(){
        default_camera();
        STREAM_PID.kill(); //kill ffmpeg process
    });
    app.get('/video_change',function(){
        //process.kill(STREAM_PID); //기존 프로세서 종료
        //바꾸고 싶은 카메라 A,B,C,D 선택 후 해당 카메라로 변경
        C_camera();
            var videostreaming2 = spawn('ffmpeg',streamStart);
            STREAM_PID = videostreaming2;
            videostreaming2.stdout.on('data', function(data) {
            console.log('stdout: ' + data);
            });
            
            videostreaming2.stderr.on('data', function(data) {
                console.log('stderr: ' + data);
            });
            
            videostreaming2.on('exit', function(code) {
                console.log('exit: ' + code);
            });
    });
    app.get('/pic',function(){
        module1.then(()=>{

                //사진전송


        })
        .catch((e)=>{
            console.log(e);
        })

        
    })

    function module1 (){
        return new Promise((resolve, reject)=>{
            default_camera(); //default C_camera
            STREAM_PID.kill(); //kill ffmpeg process
            C_camera(); //select C_camera
            var cam_info =[
                "-r","1280*720",
                "LecterRoom1_pic.jpg"
            ]
            var getting_gic =  spawn('fswebcam',streamStart);
                getting_gic.stdout.on('data', function(data) {
                console.log('stdout: ' + data);
                });
                getting_gic.stderr.on('data', function(data) {
                    console.log('stderr: ' + data);
                });
                getting_gic.on('exit', function(code) {
                    console.log('exit: ' + code);
                    resolve(); //resolve(data) 매개변수 resolve(다음코드 실행 발화 함수)
                });

                
        })
    }
