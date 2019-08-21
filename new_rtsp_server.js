const RtspServer = require('rtsp-streaming-server').default;
var Recorder = require('rtsp-recorder');
var GPIO =require('onoff').Gpio//GPIO NO, input setting

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


const server = new RtspServer({
    serverPort: 5554, //ffmpeg 접속 포트 ex) ffmpeg -i <your_input>.mp4 -c:v copy -f rtsp rtsp://127.0.0.1:5554/stream1
    clientPort: 6554,
    rtpPortStart: 10000,
    rtpPortCount: 10000
});
 
 
async function run(){
    try {
        await server.start();
    } catch (e) {
        console.error(e);
    }
}
//select C camera
function C_camera(){
    what_CAM = "C";
    cam_GPIO_1.writeSync(0);//GPIO_4
    cam_GPIO_2.writeSync(1);//GPIO_17
    cam_GPIO_3.writeSync(0);//GPIO_18
}

C_camera();
run();
//-------------------------------------------------------------------
var rec = new Recorder({
    url: 'rtsp://127.0.0.1:5554/stream1', //url to rtsp stream
    timeLimit: 60*50, //length of one video file (seconds)
    folder: './', //path to video folder
    prefix: 'vid-', //prefix for video files
    movieWidth: 1280, //width of video
    movieHeight: 720, //height of video
    // maxDirSize: 1024*20, //max size of folder with videos (MB), when size of folder more than limit folder will be cleared
    maxTryReconnect: 15 //max count for reconnects
 
});
 
//start recording
rec.initialize();
 
//start stream to websocket, port 8001
rec.wsStream(8001);