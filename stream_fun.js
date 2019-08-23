
var stream_make_port = process.argv[3]//새로운 스트림 설정 

var streamServer =  require('http').createServer( function(request, response) {
        var params = request.url.substr(1).split('/');//접속경로 따져서 올바른 연결만 확인
        //console.log("params[1] : "+params[0]+" : "+JSON.stringify(request))
        if( params[0] == STREAM_SECRET ) {
            // width = 1280;
            // height = 960;
            console.log(
                'Stream Connected: ' + request.socket.remoteAddress +':' + request.socket.remotePort + ' size: ' + width + 'x' + height);
                request.on('data', function(data) {
                    process.stdout.write(data) //모 프로세스로 데이터 전송
                    //socketServer.broadcast(data, {binary: true},request.socket.remoteAddress); //stream1.해당되는 PI에서 데이터가 넘어옴
                });
                request.on('end',()=>{
                    process.stderr.write('stream connection done') 
                    console.log('stream connection done')
                })
        }else {
            console.log('Failed Stream Connection: '+ request.socket.remoteAddress + request.socket.remotePort + ' - wrong secret.');
            response.end();
        }
    }).listen(stream_make_port,()=>{
        process.stderr.write('Listening for MPEG Stream on http://127.0.0.1:'+stream_make_port+'/<secret>/<width>/<height>')
        console.log('Listening for MPEG Stream on http://127.0.0.1:'+stream_make_port+'/<secret>/<width>/<height>');
    });


//이하 녹화 기능
fs.writeFile('./test.mpg','w',()=>{ //fs1.파일을 만든다.쓰기전용
    console.log("open to file")
})
var writeStream = fs.createWriteStream('./test.mpg'); //fs2.해당 파일을 쓰기전용 스트림과 연결

writeStream.end();//fs4.쓰기전용스트림 종료

writeStream.end(()=>{
    console.log("write Done")
    
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

