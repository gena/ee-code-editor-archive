/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_CH4"),
    co = ee.ImageCollection("COPERNICUS/S5P/NRTI/L3_CO");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(images.select('CH4_column_volume_mixing_ratio_dry_air'), {}, 'CH4 raw')

var image = images.select('CH4_column_volume_mixing_ratio_dry_air')
  .map(function(i) { return i.resample('bicubic') })
  .reduce(ee.Reducer.stdDev())

Map.addLayer(image, { min: 1, max: 50 }, 'CH4 std')

var image = images.select('CH4_column_volume_mixing_ratio_dry_air')
  .map(function(i) { return i.resample('bicubic') })
  .reduce(ee.Reducer.mean())

Map.addLayer(image, {min:0, max: 100}, 'CH4, mean')





Map.addLayer(co.select('CO_column_number_density'), {}, 'CO raw')

var image = co.select('CO_column_number_density')
  .map(function(i) { return i.resample('bicubic') })
  .reduce(ee.Reducer.stdDev())

Map.addLayer(image, { min: 1, max: 50 }, 'CO std')

var image = co.select('CO_column_number_density')
  .map(function(i) { return i.resample('bicubic') })
  .reduce(ee.Reducer.mean())

Map.addLayer(image, {min:0, max: 100}, 'CO, mean')
