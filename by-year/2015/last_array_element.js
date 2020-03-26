var a = ee.Array([1,3,4])

var index = a.length().get([0]).subtract(1)

var last = a.get([index])

print(last)
