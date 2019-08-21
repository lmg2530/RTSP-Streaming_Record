const fs = require('fs');
var hexToBinary = require('hex-to-binary');

var mp4_header ="000000146674797069736f6d000002006d70343100000008667865650028d2596d646174"
                // var mp4_header = 0000 0014 6674 7970 6973 6f6d 0000 0200
                // 6d70 3431 0000 0008 6678 6565 0028 d259
                // 6d64 6174 //이하 데이터
var mp4_header_bin = hexToBinary(mp4_header)
fs.writeFile('./text1.mp4', mp4_header_bin+data, 'utf8', function(error){
    if(error){
        console.log(error)
    }
	console.log('write end')
});


var hexString = 'AF30B';
 
// 10101111001100001011
console.log(hexToBinary(mp4_header));