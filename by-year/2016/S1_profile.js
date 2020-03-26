/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    geometry = /* color: #d63000 */ee.Geometry.LineString(
        [[-120.15064745377083, 39.38071954891084],
         [-120.17583842847637, 39.385960350039504]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function sampleLinePoints(l, count) {
  var length = l.length();
  var step = l.length().divide(count);
  var distances = ee.List.sequence(0, length, step)

  function makePointFeature(coord, offset) {
    var pt = ee.Algorithms.GeometryConstructors.Point(coord).buffer(20);
    return new ee.Feature(pt).set('offset', offset)
  }
  
  var lines = l.cutLines(distances).geometries();

  var points =   lines.zip(distances).map(function(s) {
    var line = ee.List(s).get(0);
    var offset = ee.List(s).get(1)
    return makePointFeature(ee.Geometry(line).coordinates().get(0), offset)
  })
  
  points = points.add(makePointFeature(l.coordinates().get(-1), length))

  return new ee.FeatureCollection(points);
}


s1 = s1
//.filterBounds(Map.getBounds(true))
.filterBounds(geometry)
/*
.filter(
  ee.Filter.and(
  ee.Filter.neq('instrumentMode', 'EW'),
  ee.Filter.neq('instrumentMode', 'IW')
))
*/

print(s1)

var vv = s1.filter(ee.Filter.eq('transmitterReceiverPolarisation', ['VV'])).select(0)

Map.addLayer(vv.mean(), {min:-50, max:-10}, 'VV')
//Map.addLayer(s1.filter(ee.Filter.eq('transmitterReceiverPolarisation', ['HH'])).select(0).mean(), {min:-50, max:-10}, 'HH')
//Map.addLayer(s1.select('VV').count(), {min:1, max:10}, 'VV')


var segmentCount = 100;
var points = sampleLinePoints(geometry, segmentCount);
Map.addLayer(points)

var count = 30
var list = s1.toList(count)

print(list)

ee.List.sequence(0, count-1).getInfo(function(indices) {
  indices.map(function(i) {
    var image = ee.Image(list.get(i)).select(0)
    
    var samples = image.reduceRegions(points, ee.Reducer.median())
    print(image.date())
    print(Chart.feature.byFeature(samples, 'offset', 'first'))
    
    Map.addLayer(image, {min:-30, max:1}, i.toString())
  })
})

/*
var samples = dem.reduceRegions(points, ee.Reducer.first())
print(Chart.feature.byFeature(samples, 'offset', 'first'))
Map.addLayer(dem, {min:0, max: 2000}, 'SRTM')

var samples = ned.reduceRegions(points, ee.Reducer.first())
print(Chart.feature.byFeature(samples, 'offset', 'first')) 
Map.addLayer(ned, {min:0, max: 2000}, 'NED')
*/

//print(ui.Chart.image.(geometry))


