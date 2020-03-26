var path = 'gs://gee-storage.appspot.com/test_binary.dat'

function readBinaryArray(path, precision) {
// read a binary array from a Blob stored in Google Cloud Storage
// assume little-endian encoding and given precision (default uint8)
// TODO handle signed precision
  var numBytes = 1;
  if (precision == 'uint8') {numBytes = 1;}
  if (precision == 'uint16') {numBytes = 2;}
  if (precision == 'uint32') {numBytes = 4;}
  var str = ee.Blob(path).string().getInfo();
  var strLen=str.length;
  var buf = ee.List.repeat(0,strLen/numBytes);
  var val = 0, cnt = 0;
  for (var i=0; i<strLen/numBytes; i++) {
    for (var c=0, val = 0; c<numBytes; c++, cnt++) {
      val = (val << 8) + str.charCodeAt(cnt);
    }
    buf = buf.set(i,val);
  }
  return ee.Array(buf)
}

print(readBinaryArray(path),'uint16');
