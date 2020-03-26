var image = ee.Image('LANDSAT/LC8_L1T/LC82220762015015LGN00');

var vis = {
  bands: ['B5', 'B6', 'B4'],
  min: [0, 1977, 3640],
  max: [37401, 16151, 10260]
};

Map.addLayer(image, vis)

// show histogram
var scale = 300
var maxBuckets = 100
print(ui.Chart.image.histogram(image.select('B5'), image.geometry(), scale, maxBuckets))
print(ui.Chart.image.histogram(image.select('B6'), image.geometry(), scale, maxBuckets))
print(ui.Chart.image.histogram(image.select('B4'), image.geometry(), scale, maxBuckets))

var hist = image.reduceRegion(ee.Reducer.histogram(maxBuckets), image.geometry(), scale)
print(hist)