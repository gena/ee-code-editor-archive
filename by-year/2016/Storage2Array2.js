function readBinaryArray(path, precision,dimensions) {
// Read a binary array stored in Google Cloud Storage 'path'
// assuming little-endian encoding and given precision (default uint8).
// Optional dimensions parameter convert into n-d array, otherwise
// output is a 1-d vector.
//
// Currently limited to 1048576 bytes

  // Number of bytes per value
  var numBytes = 1, signed = 0;
  if (precision == 'uint8') {numBytes = 1;}
  if (precision == 'uint16') {numBytes = 2;}
  if (precision == 'uint32') {numBytes = 4;}
  if (precision == 'int8') {numBytes = 1; signed = 1}
  if (precision == 'int16') {numBytes = 2; signed = 1}
  if (precision == 'int32') {numBytes = 4; signed = 1}

  var str = ee.Blob(path).string('ISO-8859-1').getInfo();
  var strLen=str.length;

  // If not defined, output would be a vector
  if (typeof dimensions == 'undefined') {dimensions = [strLen/numBytes]}
  
  // First convert the binary String into a single vector list
  var buf = [], val = 0, cnt = 0, maxval = (1 << numBytes*8-1)-1; 
  for (var i=0; i<strLen/numBytes; i++) {
    val = 0;
    for (var c=0; c<numBytes; c++, cnt++) {
      val = val + (str.charCodeAt(cnt) << c*8);
    }
    if (signed !== 0 & val > maxval) {
      val = val-(1<<numBytes*8);
    }
    buf.push(val);
  }
  
  // Then reorganize as an n-d list based on 'dimensions'
  var matrix, k;
  for (var dims = 0; dims < dimensions.length; dims++) {
    matrix = [];
    for (i = 0, k = -1; i < buf.length; i++) {
        if (i % dimensions[dims] === 0) {
            k++;
            matrix[k] = [];
        }
        matrix[k].push(buf[i]);
    }
    buf = matrix;
  }

  // Return as ee.Array
  return ee.Array(matrix[0])
}

var path = 'gs://gee-storage.appspot.com/test_binary.dat'
var test=readBinaryArray(path,'int16',[1500,10,30]);
print(test);
