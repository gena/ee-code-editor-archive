var values = ee.List([3,5.5,7,8,9,11,13,15])

var images = values.map(function (v) {
  return ee.Image(ee.Number(v)).toFloat().rename(['value']);
})
var ic = ee.ImageCollection.fromImages(images);

print(Chart.array.values(values, 0, [1,2,3,4,5,6,7,8]))

/**
 * http://onlinestatbook.com/2/introduction/percentiles.html
 * 
 * 25% is expected to be 5.5
 * 
 * R(P) = P/100 x (N + 1)
 * 
 * values: [ 3, 5, 7, 8, 9,11,13,15]
 * ranks:  [ 1, 2, 3, 4, 5, 6, 7, 8]
 * 
 * R(25) = 25/100 x (8 + 1) = 9/4 = 2.25
 * 
 * P = (0.25)(7 - 5) + 5 = 5.5
 */

var p25 = ic.reduce(ee.Reducer.percentile({percentiles:[25], maxRaw:5}));
Map.addLayer(p25)

var sample = ee.Feature(p25.sample(ee.Geometry.Point(0,0), 30).first())
print(sample.get('value_p25'))
