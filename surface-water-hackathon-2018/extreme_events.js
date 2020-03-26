/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l5 = ee.ImageCollection("LANDSAT/LT05/C01/T1_TOA"),
    l4 = ee.ImageCollection("LANDSAT/LT04/C01/T1_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE07/C01/T1_RT_TOA"),
    jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater"),
    aoi = /* color: #0b4a8b */ee.Geometry.Point([-94.3341064453125, 58.45348121776238]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var colorbrewer = require('users/gena/packages:colorbrewer')
Map.centerObject(aoi, 10);

var palettes = {
  water: ['0000ff'], //colorbrewer.Palettes.Blues[5],
  probability: ['0000ff']//colorbrewer.Palettes.YlOrRd[5]
}

var hydro = require('users/gena/packages:hydro')
//var hand = hydro.Map.addHand({layer: {name: 'HAND 90m, MERIT'}, type: 'MERIT', smoothing: false})
var hand = hydro.Map.addHand({layer: {name: 'HAND 30m, FA 100'}, smoothing: false})

Map.addLayer(ee.Image(1), {palette: ['ffffff']}, 'white', true, 0)
Map.addLayer(ee.Image(1), {palette: ['000000']}, 'black', true, 0)

var s1 = ee.ImageCollection("COPERNICUS/S1_GRD")
  //.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  //.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'HH'))
  //.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
  //.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  // Filter to get images collected in interferometric wide swath mode.
  //.filter(ee.Filter.eq('instrumentMode', 'IW'))
  //.filterDate('2017-01-01', '2020-01-01')
  .filterBounds(Map.getBounds(true))
  
print(s1.first())
  
s1 = s1  
  // .select(['VV'])
  .select(['HH'])
  //.map(addAllNonZero).filter(ee.Filter.eq('all', 1))
  
  .map(function(i) {
    return i.clip(i.select(0).geometry().buffer(-6000))
  })
  
var s1min = s1.reduce(ee.Reducer.percentile([0]))  
 
Map.addLayer(s1min, {min:-25, max: -5}, 'S1 0', false)

//Map.addLayer(images.reduce(ee.Reducer.percentile([1])), {min:-25, max: -5}, '1')
//Map.addLayer(images.reduce(ee.Reducer.percentile([2])), {min:-25, max: -5}, '2')
//Map.addLayer(images.reduce(ee.Reducer.percentile([3])), {min:-25, max: -5}, '3')

var bounds = ee.Geometry(Map.getBounds(true))

var s2 = ee.ImageCollection("COPERNICUS/S2")
  .filterBounds(bounds)
  .select(['B3','B12'])
  
  
// pre-pixel cloud masking using CDF
var band = 'B12' // swir1
var p75 = s2.select(band).reduce(ee.Reducer.percentile([75]))

// mask-out pixels with high swor1 values
s2 = s2.map(function(i) {
  return i.updateMask(i.select(band).lt(p75))
})

// preview
// var animation = require('users/gena/packages:animation')
// animation.animate(s2.map(function(i) { return i.visualize({bands: ['B12', 'B12', 'B3'], min: 0, max: 3500 })}))


var ndwiS2min = s2.reduce(ee.Reducer.percentile([0])).normalizedDifference()

Map.addLayer(ndwiS2min, {min:0, max: 1}, 'NDWI S2 0', false)

function clipBoundary(radius) {
  return function(i) {
    return i
      .clip(i.geometry().buffer(radius))
  }
}

function mergeMask(i) {
  return i
    .updateMask(i.select(['B2','B5']).mask().reduce(ee.Reducer.allNonZero()))
}

l5 = l5
  .filterBounds(bounds)
  .map(clipBoundary(-7000))
  .select(['B2', 'B5'])

l4 = l4
  .filterBounds(bounds)
  .select(['B2', 'B5'])

l7 = l7
  .map(clipBoundary(-7000))
  .map(mergeMask)
  .filterBounds(bounds)
  .select(['B2', 'B5'])
  

// Map.addLayer(l5.reduce(ee.Reducer.percentile([0])).normalizedDifference(), {min:0, max: 1}, 'NDWI L5 0', false)
// Map.addLayer(l4.reduce(ee.Reducer.percentile([0])).normalizedDifference(), {min:0, max: 1}, 'NDWI L4 0', false)
// Map.addLayer(l7.reduce(ee.Reducer.percentile([0])).normalizedDifference(), {min:0, max: 1}, 'NDWI L7 0', false)

var pWaterS1 = s1min
  .multiply(-1).unitScale(15, 25).clamp(0, 1)  // water prior, TODO: use Otsu or multi-class, or some inference methods ...
  
var pWaterS2 = ndwiS2min
  .unitScale(0.7, 1).clamp(0, 1) // water prior, TODO: use Otsu or multi-class, or some inference methods ...
  
var pWaterHAND =  
    ee.Image(1).subtract(hand.unitScale(0, 50).clamp(0, 50)) // HAND prior

// P(water) = ( P(water | S1) + P(water | S2) ) * P(water | HAND)

var pWater = pWaterS2.add(pWaterS1)
  .multiply(pWaterHAND)

// water
var water = ndwiS2min.mask(pWater)

var scale = Map.getScale()

// show chart of NDWI values over potential water
var chart = ui.Chart.image.histogram({
  image: ndwiS2min.mask(pWater.gt(0.05)), 
  region: ee.Geometry(Map.getBounds(true)), 
  scale: scale, 
  maxBuckets: 150
})

chart = chart.setOptions({ title: 'NDWI values over potential water' })
// print(chart)
  
// show chart of HAND values over potential water
var chart = ui.Chart.image.histogram({
  image: hand.mask(pWater.gt(0.05)), 
  region: ee.Geometry(Map.getBounds(true)), 
  scale: scale, 
  maxBuckets: 150
})

chart = chart.setOptions({ title: 'HAND values over potential water' })
// print(chart)

// show chart of S1 values
var chart = ui.Chart.image.histogram({
  image: s1min, 
  region: ee.Geometry(Map.getBounds(true)), 
  scale: scale, 
  maxBuckets: 150
})

chart = chart.setOptions({ title: 'S1 values' })
//print(chart)


Map.addLayer(water, {palette: palettes.water }, 'extreme water')

Map.addLayer(pWaterS1.mask(pWaterS1), {palette: palettes.probability }, 'P(water | S1)', false)
Map.addLayer(pWaterS2.mask(pWaterS2), {palette: palettes.probability }, 'P(water | S2)', false)
Map.addLayer(pWaterHAND.mask(pWaterHAND), {palette: palettes.probability }, 'P(water | HAND)', false)

var waterJrc = jrc.select('occurrence').divide(100)

Map.addLayer(waterJrc.mask(waterJrc), {palette: palettes.water}, 'JRC', false)
