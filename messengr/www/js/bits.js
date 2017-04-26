/*********************************************
Author: Steve Griffith <griffis@algonquincollege.com>
Description: Library for converting strings to bits and back
Version: 1.1.0
Updated: April 8, 2017

Usage:
::::::   METHODS   ::::::

BITS.setUserId(_bitArray, _canvas)
- accept an array of 16 bits and set them in the blue channel of the first 16 pixels on the _canvas

BITS.setMsgLength(_bitArray, _canvas)
- accept an array of 16 bits and set them in the blue channel of the second 16 pixels on the _canvas
- This is the number of bits in the message. (The number of characters * 16)
- This will match the number of pixels holding the message

BITS.setMessage(_bitArray, _canvas)
- take the _bitArray and save those bits in the blue channels starting at pixel BITS.magicPixel on the _canvas

BITS.getMessage(_userId, _canvas)
- starting at pixel BITS.magicPixel on _canvas extract the message
- each 16 pixels' blue channel value represents a single character
- validates that the first 16 blue values on _canvas match the _user_id passed to the function
- returns the text message

BITS.stringToBitArray(_str)
- take a string and convert it into an array of two-byte integers and then into an array of bits
- returns the array of bits

BITS.numberToBitArray(_num)
- take the number passed in and convert it to an array of 16 bits
- return an array of 16 bits

*********************************************/


var BITS = (function(){
    var magicPixel = 2017;  //first PIXEL to read or write for the message
    
    function setUserId(_bitArray, _canvas){
        //accept an array of 16 bits and set them in the blue channel of the first 16 pixels on the _canvas
        if(_bitArray.length !== 16){
            throw new Error('Invalid user id bit array size.');
        }
        var ctx = _canvas.getContext('2d');
        var imgData = ctx.getImageData(0,0,_canvas.width, _canvas.height);
        for(var i=0; i<16; i++){
            var index = (i*4)+2;
            var blue = imgData.data[index];
            var right = blue >> 1;
            imgData.data[index] = (right << 1) | _bitArray[i];
        }
        ctx.putImageData(imgData, 0, 0);
        return _canvas;
    }
    
    function setMsgLength(_bitArray, _canvas){
        //accept an array of 16 bits and set them in the blue channel of the second 16 pixels on the _canvas
        if(_bitArray.length !== 16){
            throw new Error('Invalid message length bit array size.');
        }
        var ctx = _canvas.getContext('2d');
        var imgData = ctx.getImageData(0, 0, _canvas.width, _canvas.height);
        var data = imgData.data;
        //console.log('setMsgLength', _bitArray);
        for(var p=16; p<32; p++){
            var index = (p*4)+2;
            var blue = imgData.data[index];
            //console.log('blue', blue);
            var right = blue >> 1;
            imgData.data[index] = (right << 1) | _bitArray[p-16];
            //console.log('updated', imgData.data[index]);
        }
        ctx.putImageData(imgData, 0, 0);
        return _canvas;
    }
    
    function getUserId(_canvas){
        //read the last bit inside each of the first 16 blue channel values
        //return a single two-byte integer built from the 16 bits
        var ctx = _canvas.getContext('2d');
        var imgData = ctx.getImageData(0, 0, _canvas.width, _canvas.height);
        //console.log(imgData.data.length);
        var _bitArray = [];
        for(var i=0; i<16; i++){
            var index = (i*4)+2;
            var blue = imgData.data[index];
            var bit = blue & 1;
            _bitArray.push(bit);
        }
        //console.log('user id array', _bitArray);
        return bitArrayToNumber(_bitArray);
    }
    
    function getMsgLength(_canvas){
        //read the last bit inside each of the second 16 blue channel values
        //return a single two-byte integer built from the 16 bits
        var ctx = _canvas.getContext('2d');
        var imgData = ctx.getImageData(0, 0, _canvas.width, _canvas.height);
        var _bitArray = [];
        for(var p=16; p<32; p++){
            var index = (p*4)+2;
            var blue = imgData.data[index];
            var bit = blue & 1;
            //console.log(index, blue, bit);
            _bitArray.push(bit);
        }
        //console.log('getmsglength', _bitArray);
        return bitArrayToNumber(_bitArray);
    }
    
    function setMessage(_bitArray, _canvas){
        //take the _bitArray and save those bits in the blue channels starting at pixel BITS.magicPixel on the _canvas
        var ctx = _canvas.getContext('2d');
        var imgData = ctx.getImageData(0,0,_canvas.width, _canvas.height);
        var start = magicPixel;
        var end = magicPixel + _bitArray.length;
        var bitCount = 0;
        for(var p=start; p<end; p++){
            var blue = imgData.data[(p*4)+2];
            var right = blue >> 1;
            imgData.data[(p*4)+2] = (right << 1) | _bitArray[bitCount];
            bitCount++;
        }
        ctx.putImageData(imgData, 0, 0);
        return _canvas;
    }
    
    function getMessage(_userId, _canvas){
        //starting at pixel BITS.magicPixel on _canvas extract the message
        //each 16 pixels' blue channel value represents a single character
        //validates that the first 16 blue values on _canvas match the _user_id passed to the function
        //returns the text message
        //validate the user
        var userInCanvas = getUserId(_canvas);
        //console.log('user ids', userInCanvas, _userId)
        if(userInCanvas != _userId){
            throw new Error('Invalid Access Attempt');
        }
        //now fetch the message
        var ctx = _canvas.getContext('2d');
        var imgData = ctx.getImageData(0, 0, _canvas.width, _canvas.height);
        var _bitArray = [];
        var start = magicPixel;
        var len = getMsgLength(_canvas);
        var end = magicPixel + len;
        //console.log('Message info', start, end, len);
        for(var p=start; p<end; p++){
            var index = (p*4) + 2;
            var bit = (imgData.data[index]) & 1;
            _bitArray.push(bit);
        }
        //console.log('message array', _bitArray);               
        var msg = bitArrayToString(_bitArray);
        return msg;
    }
    
    function numberToBitArray(_num){
        //take the number passed in and convert it to an array of 16 bits
        //return an array of 16 bits
        if(_num > Math.pow(2, 16)){
            throw new Error('Number is too large to fit in two bytes');
        }
        var _bitArray = [];
        for(var i=0; i<16; i++){
            var shift = 15 - i;
            var bit = (_num >> shift) & 1;
            _bitArray.push(bit);
        }
        //console.log('ready to set num', _bitArray);
        return _bitArray;
    }
    
    function bitArrayToNumber(_bitArray){
        //take a 16 element array of bits and return a two-byte integer
        if(_bitArray.length !== 16){
            throw new Error('Invalid message length bit array size.');
        }
        var num = 0;
        for(var i=0; i<16; i++){
            var shift = 15 - i;
            //console.log(_bitArray[i] << shift);
            var num = num | (_bitArray[i] << shift);
        }
        return num;
    }
    
    function stringToBitArray(_str){
        //take a string and convert it into an array of two-byte integers and then into an array of bits
        //returns the array of bits
        var buffer = stringToArrayBuffer(_str);
        var twoByteView = new Uint16Array(buffer);
        var len = twoByteView.length;
        var _bitArray = [];
        for(var i=0; i<len; i++){
            //each two byte number will become 16 bits
            var num = twoByteView[i];
            //console.log('stringToBitArray',num);
            _bitArray.push( (num>>15) & 1 );
            _bitArray.push( (num>>14) & 1 );
            _bitArray.push( (num>>13) & 1 );
            _bitArray.push( (num>>12) & 1 );
            _bitArray.push( (num>>11) & 1 );
            _bitArray.push( (num>>10) & 1  );
            _bitArray.push( (num>>9) & 1  );
            _bitArray.push( (num>>8) & 1  );
            _bitArray.push( (num>>7) & 1  );
            _bitArray.push( (num>>6) & 1  );
            _bitArray.push( (num>>5) & 1  );
            _bitArray.push( (num>>4) & 1  );
            _bitArray.push( (num>>3) & 1  );
            _bitArray.push( (num>>2) & 1  );
            _bitArray.push( (num>>1) & 1  );
            _bitArray.push( num & 1  );
        }
        return _bitArray;
    }
    
    function bitArrayToString(_bitArray){
        //take any _bitArray passed in and convert it to a String
        if(_bitArray.length % 16 != 0){
            throw new Error('Invalid message length', _bitArray.length);
        }
        var str = "";
        var len = _bitArray.length;
        for(var b=0; b<len; b=b+16){
            var num = 0;
            num = num |
                _bitArray[b] << 15 |
                _bitArray[b+1] << 14 |
                _bitArray[b+2] << 13 |
                _bitArray[b+3] << 12 |
                _bitArray[b+4] << 11 |
                _bitArray[b+5] << 10 |
                _bitArray[b+6] << 9 |
                _bitArray[b+7] << 8 |
                _bitArray[b+8] << 7 |
                _bitArray[b+9] << 6 |
                _bitArray[b+10] << 5 |
                _bitArray[b+11] << 4 |
                _bitArray[b+12] << 3 |
                _bitArray[b+13] << 2 |
                _bitArray[b+14] << 1 |
                _bitArray[b+15];
            var char = String.fromCharCode(num);
            //console.log(num, char);
            str = str.concat(char);
        }
        return str;
    }
    
    function stringToArrayBuffer(_str) {
        var strLen = _str.length;
        var byteLen = _str.length * 2;
        // 2 bytes for each char
        var buffer = new ArrayBuffer(byteLen); 
        var twoByteView = new Uint16Array(buffer);
        for (var i=0; i<strLen; i++) {
            twoByteView[i] = _str.charCodeAt(i);
        }
        return buffer;
    }
    
    function arrayBufferToString(buf) {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    }
    
    return {
        setUserId:              setUserId,
        setMsgLength:           setMsgLength,
        setMessage:             setMessage,
        getMessage:             getMessage,
        numberToBitArray:       numberToBitArray,
        stringToBitArray:       stringToBitArray
    };
    
    /***********************
    Not returned - PRIVATE
    
        ,magicPixel:            magicPixel,
        getUserId:              getUserId,
        getMsgLength:           getMsgLength,
        bitArrayToNumber:       bitArrayToNumber,
        bitArrayToString:       bitArrayToString
        stringToArrayBuffer:    stringToArrayBuffer,
        arrayBufferToString:    arrayBufferToString
    ************************/
    
})();