/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var ic = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
ic = ic
  .filterBounds(Map.getBounds(true))
  .filterDate('2015-01-01', '2015-06-01')
  .select(0)
  .map(function(i) {
    return i.unmask(0, false)
  })
  
var a = ic.toArray()

Map.addLayer(a)

var bandNames = ee.List.sequence(1, ic.size()).map(function(i) {
  return ee.String('T').cat(ee.Number(i).format('%d'))
})

print(bandNames)

var multiband = a.matrixTranspose(0, 1).arrayProject([1]).arrayFlatten([bandNames])

Map.addLayer(multiband)

