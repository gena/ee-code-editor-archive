var a = ee.Array([1,3,4])

var last = a.get([-1])

print(last)

var a3 = Array(3)
for(var i=0; i<3; i++) {
  a3[i] = i
}
print(ee.Array(a3))

var a1 = ee.Array([1,2,3])
var a2 = ee.Array([2,2,2])

print(a1.multiply(a2))