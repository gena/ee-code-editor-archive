/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.Point([-108.3966064453125, 42.10637370579324]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// NLCD 2011
var nlcd2011 = ee.Image('USGS/NLCD/NLCD2011').select(0);
var crops = nlcd2011.updateMask(nlcd2011.eq(82));
Map.addLayer(crops.focal_max(5), {opacity:0.3}, 'crops (buffer)');
Map.addLayer(crops, null, 'crops');
var proj = crops.projection();
print(proj)

// retreive coordinates of the closest pixel to point?

var maxPixels = 2e8; // relax limit a bit

function findNearestBuffer(point, mask, bufferSize, scale) {
  scale = ee.Number(scale)
  bufferSize = ee.Number(bufferSize)
  
  var buffer = point.buffer(ee.Number(bufferSize), ee.ErrorMargin(scale, 'meters'))
  var dist = ee.FeatureCollection([geometry]).distance(ee.Number(bufferSize))

  // debugging
  var s = scale.divide(proj.nominalScale()); // comput scale for visualization
  Map.addLayer(dist.mask(dist.gt(0)).reproject(proj.scale(s, s)), {min: 0, max: bufferSize.getInfo()}, scale.getInfo().toString(), false)
  
  dist = dist.mask(dist.gt(0).and(mask)).addBands(ee.Image.pixelLonLat())
  
  // compute smallest buffer size around point where mask is non-zero
  return dist.reduceRegion(ee.Reducer.min(3), buffer, scale, null, null, false, maxPixels)
}

var bufferSize = 500000;
var scale = 50000;

var min = findNearestBuffer(geometry, crops, bufferSize, scale)
print(bufferSize)

var bufferSize = min.get('min');
var scale = 5000;
var min = findNearestBuffer(geometry, crops, bufferSize, scale)
print(bufferSize)

var bufferSize = min.get('min');
var scale = 500;
var min = findNearestBuffer(geometry, crops, bufferSize, scale)
print(bufferSize)

var bufferSize = min.get('min');
var scale = 30;
var min = findNearestBuffer(geometry, crops, bufferSize, scale)
print(bufferSize)

// show the nearest point
var long = min.get('min1');
var lat = min.get('min2');

var point = ee.Geometry.Point([long, lat]);
Map.addLayer(point, {}, 'nearest point')

var line = ee.Geometry.LineString([geometry.coordinates(), point.coordinates()])
Map.addLayer(line, {color:'ff0000'}, 'nearest line')

