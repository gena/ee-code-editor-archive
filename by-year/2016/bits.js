/***
 * Pad a number with leading zeros
 */
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

/***
 * Test if specific bit is set
 */
function testBit(value, bit) {
    // generate a binary pattern
    var pattern = Math.pow(2, bit) 
    
    // test bit
    var result = ee.Number(value).bitwiseAnd(pattern).gt(0);
    
    // debug
    print(pad(value.toString(2), 4) + ' AND ' + pad(pattern.toString(2), 4) + ' = ' + result.getInfo())
    
    return result;
}

// tests
var value = 0
print(testBit(value, 0))
print(testBit(value, 1))

var value = 1
print(testBit(value, 0))
print(testBit(value, 1))

var value = 2
print(testBit(value, 0))
print(testBit(value, 1))
