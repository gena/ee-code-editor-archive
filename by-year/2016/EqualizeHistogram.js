// histogram reducer

var image = new ee.Image(new ee.ImageCollection("LANDSAT/LC8_L1T_TOA")
  .select(['B4', 'B3', 'B2'])
  .filterBounds(ee.Geometry(Map.getBounds(true)).centroid(100))
  .filter(ee.Filter.lt('CLOUD_COVER', 15))
  .first());

//Map.centerObject(image, 14);
Map.addLayer(image);

var g = Map.getBounds(true);
var scale = 300

var i = image.reduce(ee.Reducer.max()) // reduce to a single band
var minMax = i.reduceRegion(ee.Reducer.percentile([1, 98]), g, scale).values().getInfo();
var min = minMax[0]
var max = minMax[1]

Map.addLayer(image, {'min': min, 'max': max});


