// VideoDemo.js

var min_value = 0;
var max_value = 1;

var LC8_BANDS = ['B1',    'B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10', 'BQA'];
var LC7_BANDS = ['B1',    'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B8', 'B8', 'B7'];
var STD_NAMES = ['blue2', 'blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp', 'BQA'];

// load Landsat 8 imagery
var collection = ee.ImageCollection('LC8_L1T_TOA')
  .select(LC8_BANDS, STD_NAMES)
  .filterBounds(Map.getBounds(true))
  .map(function(image1){ // pan-sharpen
    //var rgb = image1.select('temp', 'green', 'blue').unitScale(0, max_value);
    //var rgb = image1.select('nir', 'red', 'blue').unitScale(0, max_value);
    var rgb = image1.select('swir2', 'nir', 'green').unitScale(0, max_value);
    //var rgb = image1.select('red', 'green', 'blue').unitScale(min_value, max_value);
    //var rgb = image1.select('nir', 'red', 'green').unitScale(min_value, max_value);
    var pan = image1.select('pan').unitScale(min_value, max_value);

    // Convert to HSV, swap in the pan band, and convert back to RGB.
    var hsv  = rgb.rgbtohsv();

    var intensity = pan;
    //var intensity = pan.add(hsv.select('value').multiply(0.5));

    //var swir2 = image1.select('swir2').unitScale(0, max_value);
    //var intensity = pan.add(swir2.multiply(ee.Image(0.3)));

    var huesat = hsv.select('hue', 'saturation');
    var upres = ee.Image.cat(huesat, intensity).hsvtorgb();

    return upres.visualize({min:0.02, max:0.1});
  });

Map.addLayer(ee.Image(collection.first()));

var aoi = ee.Geometry(Map.getBounds(true))

// Export (change dimensions or scale for higher quality)
Export.video(collection, 'video_test', {
  dimensions: '720',
  framesPerSecond: 12,
  region: JSON.stringify(aoi.getInfo())});
  