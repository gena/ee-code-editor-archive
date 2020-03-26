/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var monthly = ee.ImageCollection("JRC/GSW1_0/MonthlyHistory"),
    yearly = ee.ImageCollection("JRC/GSW1_0/YearlyHistory"),
    occurrence = ee.Image("JRC/GSW1_0/GlobalSurfaceWater"),
    prosserCreek = ee.Image("users/gena/water-occurrence-ProsserCreek");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var labelMonthly = {nodata: 0, nowater: 1, water: 2}

occurrence = occurrence.select('occurrence')

var p = [10, 20, 30, 40, 50, 60, 70, 80, 90]

Map.addLayer(prosserCreek, {}, 'prosser creek')

print('RMSE1', prosserCreek.subtract(occurrence).pow(2).reduceRegion(ee.Reducer.mean()).values().get(0))


var r = [15, 30, 60, 90]
var s = [15, 30, 60, 90]
s.map(function(ss) {
  r.map(function(rr) {
    var o = occurrence.unmask().convolve(ee.Kernel.gaussian(rr, ss, 'meters'))
    print('RMSE r=' + rr + ', sigma=' + ss, 
      prosserCreek.subtract(o).pow(2).reduceRegion(ee.Reducer.mean()).values().get(0))
  })  
})


var edges = ee.List([])
p.map(function(i) {
  var edge = occurrence.subtract(i).zeroCrossing()
  edges = edges.add(edge.mask(edge))
})

Map.addLayer(ee.ImageCollection(edges).mosaic(), { palette: ['ff0000']}, 'zero-crossings, occurrence')


occurrence = occurrence.unmask()
  .convolve(ee.Kernel.gaussian(30, 15, 'meters'))
Map.addLayer(occurrence.divide(100), {}, 'occurrence')

print('RMSE2', prosserCreek.subtract(occurrence).pow(2).reduceRegion(ee.Reducer.mean()).values().get(0))


var edges = ee.List([])
p.map(function(i) {
  var edge = occurrence.subtract(i).zeroCrossing()
  edges = edges.add(edge.mask(edge))
})

Map.addLayer(ee.ImageCollection(edges).mosaic(), { palette: ['ff0000']}, 'zero-crossings, G(occurrence)')


monthly = monthly.map(function(i) { 
  return i
    //.resample('bicubic')
    .convolve(ee.Kernel.gaussian(40, 20, 'meters'))
  
  
})

var monthly1985 = monthly.filterDate('1985-01-01', '1990-01-01')
Map.addLayer(monthly1985.mean(), {}, 'occurrence 1985', false)

var monthly2010 = monthly.filterDate('2010-01-01', '2015-01-01')
Map.addLayer(monthly2010.mean(), {}, 'occurrence 2010-2015', false)

