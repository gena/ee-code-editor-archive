/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var night = ee.ImageCollection("NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var style = require('users/gena/packages:style')
var l = night.select(0).reduce(ee.Reducer.percentile([95]))
Map.addLayer(l.mask(l.divide(2)), {min: 0, max: 10, palette: style.Palettes.Hot})