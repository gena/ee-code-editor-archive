var images = ee.ImageCollection("COPERNICUS/S1_GRD")
  .filter(ee.Filter.eq('instrumentMode', 'SM'))

Map.addLayer(images, {}, '', false)  

function toNatural(i) {
  return ee.Image(ee.Image.constant(10.0).pow(i.divide(10.0)).copyProperties(i, ['system:time_start']));
}

var band1 = 'HH'
var band2 = 'HV'  

var min = 0, max = 0.5
var bandNames = [band1, band2, 'angle']

var images_asc = images
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band1))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band2))
  .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
  
var images_dsc = images  
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band1))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band2))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))

var median_asc = images_asc.map(toNatural).reduce(ee.Reducer.median()).rename(bandNames)

Map.addLayer(median_asc, {min: min, max: max, bands: [band2, band2, band1]}, 'median (asc)', false)
Map.addLayer(median_asc, {min: min, max: max, bands: [band1]}, 'median (asc) ' + band1, false)
Map.addLayer(median_asc, {min: min, max: max, bands: [band2]}, 'median (asc) ' + band2, false)
Map.addLayer(images_asc, {min: min, max: max, bands: ['angle']}, 'median, angle (asc)', false)

var median_dsc = images_dsc.map(toNatural).reduce(ee.Reducer.median()).rename(bandNames)

Map.addLayer(median_dsc, {min: min, max: max, bands: [band2, band2, band1]}, 'median (dsc)', false)
Map.addLayer(median_dsc, {min: min, max: max, bands: [band1]}, 'median (dsc) ' + band1, false)
Map.addLayer(median_dsc, {min: min, max: max, bands: [band2]}, 'median (dsc) ' + band2, false)
Map.addLayer(images_dsc, {min: min, max: max, bands: ['angle']}, 'median, angle (dsc)', false)

Map.addLayer(ee.Image([median_asc.select(band1), median_dsc.select(band1)]), {min: min, max: max, bands: [band1, band1 + '_1', band1]}, 'median (asc, dsc) ' + band1, true)
Map.addLayer(ee.Image([median_asc.select(band2), median_dsc.select(band2)]), {min: min, max: max, bands: [band2, band2 + '_1', band2]}, 'median (asc, dsc) ' + band2, true)

// HH-only
var band1 = 'HH'

var bandNames = [band1, 'angle']

var images_asc = images
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band1))
  .select(bandNames)
  .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
  
var images_dsc = images  
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band1))
  .select(bandNames)
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))

var median_asc = images_asc.map(toNatural).reduce(ee.Reducer.median()).rename(bandNames)
 
Map.addLayer(median_asc, {min: min, max: max, bands: [band1]}, 'median (asc) ' + band1, false)
Map.addLayer(images_asc, {min: min, max: max, bands: ['angle']}, 'median, angle (asc)', false)

var median_dsc = images_dsc.map(toNatural).reduce(ee.Reducer.median()).rename(bandNames)

Map.addLayer(median_dsc, {min: min, max: max, bands: [band1]}, 'median (dsc) ' + band1, false)
Map.addLayer(images_dsc, {min: min, max: max, bands: ['angle']}, 'median, angle (dsc)', false)

Map.addLayer(ee.Image([median_asc.select(band1), median_dsc.select(band1)]), {min: min, max: max, bands: [band1, band1 + '_1', band1]}, 'median (asc, dsc) ' + band1, true)

var dem = ee.Image("JAXA/ALOS/AW3D30_V1_1").select('MED')
var hs = ee.Terrain.hillshade(dem, 315)
Map.addLayer(hs, {min: 90, max: 250}, 'ALOS (hs)')