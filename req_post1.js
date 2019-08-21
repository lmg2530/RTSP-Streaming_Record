const request = require('request');
var ip ="http://192.168.137.104",
    port = ":3001"

var url1 = "/video",
    url2 = "/video_stop"
    url3 = "/pic"
let options = {
    uri: ip+port+url1,
    method: 'POST',
    body:{
        Camera:"C" //C A C-학생쪽 A-칠판쪽
    },
    json:true //json으로 보낼경우 true로 해주어야 header값이 json으로 설정됩니다.
};

request.post(options, function(err,res,body){ 
    if(err)
        console.log(err);

    console.log(res);
    console.log(body)
 })
















