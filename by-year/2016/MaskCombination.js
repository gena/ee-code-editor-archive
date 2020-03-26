var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').filterDate('2005-01-01', '2006-01-01').select(['B5', 'B4', 'B2']);


var images = l7

Map.addLayer(images.reduce(ee.Reducer.percentile([15])), {min:0.03, max:0.3}, 'l7')

images = images.map(function(i) {
  var mask = i.mask();
  // var maskNew = mask.select(0).multiply(mask.select(1).multiply(mask.select(2)))
  var maskNew = maskNew.focal_min(1000, 'square', 'meters')
  return i.mask(maskNew)
})

Map.addLayer(images.reduce(ee.Reducer.percentile([15])), {min:0.03, max:0.3}, 'l7 (masked)')
