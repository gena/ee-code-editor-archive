/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var night = ee.ImageCollection("NOAA/DMSP-OLS/NIGHTTIME_LIGHTS"),
    night2 = ee.ImageCollection("NOAA/DMSP-OLS/CALIBRATED_LIGHTS_V4"),
    night3 = ee.ImageCollection("NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
night = night3.filterDate('2010-01-01', '2016-01-01')

Map.addLayer(night.select(0), {}, 'raw', false)


Map.addLayer(night.select(0).reduce(ee.Reducer.percentile([85])), {min:0, max:10}, '85%')

var min = night.reduce(ee.Reducer.percentile([5]))
var max = night.reduce(ee.Reducer.percentile([95]))
var diff = min.subtract(max)

Map.addLayer(diff.select(0), {min:-5, max:5}, 'min-max')

var trend = night.select(0).map(function(i) { return ee.Image(i.date().millis().subtract(ee.Date('1990-01-01').millis())).float().multiply(1e-10).addBands(i)}).reduce(ee.Reducer.linearFit()).select('scale')
Map.addLayer(trend.mask(trend), {palette:['ff0000', 'ffffff', '00ff00'], min:-6, max:6}, 'fit')