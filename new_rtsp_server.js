const RtspServer = require('rtsp-streaming-server').default;
var Recorder = require('rtsp-recorder');
 
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