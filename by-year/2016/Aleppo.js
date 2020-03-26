/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var aoi = ee.Geometry(Map.getBounds(true)).centroid(1)

s2 = s2
  // .select(['B8', 'B4', 'B3'])
  .select(['B12', 'B8', 'B3'])
  .filterBounds(aoi)
  .filterDate('2016-08-01', '2017-10-01')

print(s2.aggregate_count('system:time_start'))

var count = 16
var list = s2.toList(count, 0)

for(var i = 0; i < count; i++) {
  var image = ee.Image(list.get(i))
  var date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd').getInfo()
  Map.addLayer(image, {min: 1600, max: 4500}, date, i === 0)
}
