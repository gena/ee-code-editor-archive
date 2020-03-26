/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    dem = ee.Image("USGS/NED");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var s1 = s1.select(0)

s1 = s1.filterDate('2014-06-01', '2017-01-01')

var bounds = ee.Geometry(Map.getBounds(true)).centroid(1)

s1 = s1.filterBounds(bounds)

var asc = s1.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
var des = s1.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))

print(asc)
print(des)

var count = 50
var list1 = asc.toList(count)
var list2 = des.toList(count)

ee.List.sequence(0, count).getInfo(function(indices) {
  indices.map(function(i) {
    var image1 = ee.Image(list1.get(i))
    var image2 = ee.Image(list2.get(i))
    print(i, image1.date())
    print(i, image2.date())
    Map.addLayer(ee.Image([image1, image2, image1]), {min:-20, max:10}, i.toString(), i === 0)
  })
})

Map.addLayer(ee.Algorithms.Terrain(dem).select('hillshade'), {min:255, max:0})