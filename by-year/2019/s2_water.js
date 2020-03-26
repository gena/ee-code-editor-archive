/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(s2.select(0).count())

Map.addLayer(jrc.select('occurrence'), {palette:['ffff00']}, 'JRC')

//.return

var p = s2.map(function(i) {
  return i.resample('bicubic')
}).reduce(ee.Reducer.percentile([5]))

var r = p.normalizedDifference(['B3_p5', 'B8_p5'])
var g = p.normalizedDifference(['B3_p5', 'B11_p5'])
var b = p.select('B4_p5')
  
var water = ee.Image([r,g,r])


Map.addLayer(p.select(['B11_p5','B8_p5','B3_p5']), {min: 500, max:3000})
Map.addLayer(water, {min:0, max:0.3}, 'water')

var images = s2.filterBounds(Map.getBounds(true)).toList(30)
for(var i=0; i<30; i++) {
  Map.addLayer(ee.Image(images.get(i))
    .select(['B11','B8','B3']), {min: 500, max:3000}, i.toString(), i===0)
}