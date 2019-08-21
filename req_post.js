// const request = require('request');
// var ip ="ws://192.168.137.64",
//     port = ":8084"

// var url1 = "/video",
//     url2 = "/video_stop"
//     url3 = "/pic"
// let options = {
//     uri: ip+port,
//     method: 'POST',
//     body:{
//         // Camera:"C" //C A C-학생쪽 A-칠판쪽
//     },
//     json:true //json으로 보낼경우 true로 해주어야 header값이 json으로 설정됩니다.
// };

// request.post(options, function(err,res,body){ 
//     if(err)
//         console.log(err);

//     console.log(res);
//     console.log(body)
//  })
const WebSocket = require('ws');
const fs = require('fs');
var hexToBinary = require('hex-to-binary');

var mp4_header ="000000146674797069736f6d000002006d70343100000008667865650028d2596d646174"
                // var mp4_header = 0000 0014 6674 7970 6973 6f6d 0000 0200
                // 6d70 3431 0000 0008 6678 6565 0028 d259
                // 6d64 6174 //이하 데이터
var mp4_header_bin = hexToBinary(mp4_header)

 var ws = new WebSocket("ws://192.168.137.64:8084");
var buffer_to_bin;
 ws.on('open', function open() {
    ws.send('something');
  });
   var i=0;
  ws.on('message', function incoming(data) {
  fs.writeFile('text'+i+'.mp4',mp4_header_bin+data, 'utf8', function(error){
    i++;
	console.log('write end')
});
  });
  ws.on('error', function incoming(data) {
    console.log(data);
  });

  ws.on('close', function close() {
    console.log('disconnected');
  });


// 데이터를 쌓아서 N크기만큼 쌓이면 저장하고 fs
// 버퍼는 그대로 웹으로 전송해준다.