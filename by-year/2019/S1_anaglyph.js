/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    pt = /* color: #98ff00 */ee.Geometry.Point([8.639553372089836, 45.899862953304]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bounds = Map.getBounds(true)
var scale = Map.getScale()

s1 = s1
  .filterBounds(bounds)
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filterDate('2018-01-01', '2019-01-01')
  .map(toNatural)
  .map(function(i) {
    return i.set({angle_pt: i.select('angle').reduceRegion({ reducer: ee.Reducer.first(), geometry: pt, scale: 10}).values().get(0) })
  })
  
// show angles at pt
print(ui.Chart.feature.byFeature(s1, 'system:time_start', ['angle_pt']).setOptions({
  lineWidth: 0, pointSize: 2
}))

// filter by angle
//var i1 = s1.filter(ee.Filter.and(ee.Filter.gt('angle_pt', 36), ee.Filter.lt('angle_pt', 40)))
var i1 = s1.filter(ee.Filter.and(ee.Filter.lt('angle_pt', 36), ee.Filter.gt('angle_pt', 30)))

//var i2 = s1.filter(ee.Filter.gt('angle_pt', 45))
var i2 = s1.filter(ee.Filter.and(ee.Filter.gt('angle_pt', 40), ee.Filter.lt('angle_pt', 45)))

print(ee.List(i1.aggregate_array('orbitProperties_pass')).distinct())
print(ee.List(i1.aggregate_array('platform_number')).distinct())
print(ee.List(i1.aggregate_array('transmitterReceiverPolarisation')).distinct())

print(ee.List(i2.aggregate_array('orbitProperties_pass')).distinct())
print(ee.List(i2.aggregate_array('platform_number')).distinct())
print(ee.List(i2.aggregate_array('transmitterReceiverPolarisation')).distinct())

var i1mean = i1.mean()
var i1med = i1.median()
Map.addLayer(ee.Image([i1mean.select(0), i1med.select(0), i1mean.select(1)]), { min: 0, max: 0.6 }, 'i1', false)

var i2mean = i2.mean()
var i2med = i2.median()
Map.addLayer(ee.Image([i2mean.select(0), i2med.select(0), i2mean.select(1)]), { min: 0, max: 0.6 }, 'i2', false)


// anaglyph
Map.addLayer(ee.Image([i2mean.select(0), i1mean.select(0), i1mean.select(0)]), { min: 0, max: 0.7 }, 'i1, i2 (0)')
Map.addLayer(ee.Image([i2mean.select(1), i1mean.select(1), i1mean.select(1)]), { min: 0, max: 0.16 }, 'i1, i2 (1)')

// Functions to convert from dB
function toNatural(i) {
  return ee.Image(ee.Image.constant(10.0).pow(i.divide(10.0)).copyProperties(i).copyProperties(i, ['system:time_start'])).addBands(i.select('angle'), ['angle'], true);
}
