/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Load Sentinel-1 images to map Chennai flooding, India, November 2015.
var pt = Map.getCenter()
var collection =  ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(pt)
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
.sort('system:time')

var before = ee.Image(collection.first())

Map.addLayer(ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterMetadata('resolution', 'equals', 'H')
  .map(function(i) {return i.select(0).rename('0')})
  .count(), {min:1, max:100, palette:['ffffff', '000000']}, 'count', false)

/**
 * Synthetic green band is the average of VV and VH
 * See https://sentinel.esa.int/web/sentinel/user-guides/sentinel-1-sar/product-overview/polarimetry
 * @param img image
 */
function rgb(img) {
      var vv = img.select('VV');
      var vh = img.select('VH');
      return ee.Image.cat(vv, vv.add(vh).divide(2), vh);
}

//Map.setCenter(80.2538, 13.0822, 11);
Map.addLayer(rgb(before), {min:[-20, -25, -30], max:[0, -2, -5]}, 'first');

var count = collection.aggregate_count('system:id').getInfo()

var after = ee.Image(collection.toList(1, count - 1).get(0))

/**
 * Synthetic green band is the average of VV and VH
 * See https://sentinel.esa.int/web/sentinel/user-guides/sentinel-1-sar/product-overview/polarimetry
 * @param img image
 */
function rgb(img) {
      var vv = img.select('VV');
      var vh = img.select('VH');
      return ee.Image.cat(vv, vv.add(vh).divide(2), vh);
}

///Map.setCenter(80.2538, 13.0822, 11);
Map.addLayer(rgb(after), {min:[-20, -25, -30], max:[0, -2, -5]}, 'last');

var image = ee.Image(l8.select(['B4', 'B3', 'B2', 'B8', 'B6', 'B5']).filterBounds(Map.getCenter()).first())
var hsv = image.select(['B4', 'B3', 'B2']).rgbToHsv()
var rgb = hsv.select(['hue', 'saturation']).addBands(image.select('B8')).hsvToRgb()
Map.addLayer(rgb, {min:0.05, max:0.25, gamma:0.95}, 'l8 (pan)', false)
  
Map.addLayer(image.select(['B6', 'B5', 'B3']), {min:0.05, max:0.4}, 'l8', false)  