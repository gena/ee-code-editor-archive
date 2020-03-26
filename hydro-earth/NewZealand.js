/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var image1 = ee.Image("users/fbaart/landsat/LC80730892016318LGN00_B1"),
    image2 = ee.Image("users/fbaart/landsat/LC80730892016318LGN00_B2"),
    image3 = ee.Image("users/fbaart/landsat/LC80730892016318LGN00_B3"),
    image4 = ee.Image("users/fbaart/landsat/LC80730892016318LGN00_B4"),
    image5 = ee.Image("users/fbaart/landsat/LC80730892016318LGN00_B5"),
    image6 = ee.Image("users/fbaart/landsat/LC80730892016318LGN00_B6"),
    image7 = ee.Image("users/fbaart/landsat/LC80730892016318LGN00_B7"),
    image8 = ee.Image("users/fbaart/landsat/LC80730892016318LGN00_B8"),
    image9 = ee.Image("users/fbaart/landsat/LC80730892016318LGN00_B9"),
    image10 = ee.Image("users/fbaart/landsat/LC80730892016318LGN00_B10"),
    image11 = ee.Image("users/fbaart/landsat/LC80730892016318LGN00_B11"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T"),
    point = /* color: d63000 */ee.Geometry.Point([173.67290496826172, -42.405967152309124]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bandNames = ['blue2', 'blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'cirrus', 'temp1', 'temp2'];

var image = image1.addBands([image2, image3, image4, image5, image6, image7, image8, image9, image10, image11])
  .rename(bandNames)
  .unitScale(0, 65535);

Map.addLayer(image, {}, 'concatenated', false, 1.0);

// false-color composite
var vizParams = {bands: ['swir1', 'nir', 'green'], min: 0.1, max: 0.4};
Map.addLayer(image, vizParams, 'false color composite', false);

Map.centerObject(point, 14);

// add pan-sharpened false-color
var huesat = image.select(['swir1', 'nir', 'green']).rgbToHsv().select('hue', 'saturation');
var upres = ee.Image.cat(huesat, image.select('pan')).hsvToRgb();
Map.addLayer(upres, {min: 0.07, max: 0.25}, 'pansharpened', false);


// add last L8 image
var imageLast = ee.Image(l8.filterBounds(Map.getBounds(true)).sort('system:time_start', false).toList(1, 2).get(0))
  .select(['B6', 'B5', 'B3', 'B4', 'B8', 'B2'], ['swir1', 'nir', 'green', 'red', 'pan', 'blue'])
print(imageLast.get('DATE_ACQUIRED'))

imageLast = imageLast.unitScale(0, 65535)
Map.addLayer(imageLast, vizParams, 'false color composite', false);

// add pan-sharpened (RGB)
var huesat = imageLast.select(['red', 'green', 'blue']).rgbToHsv().select('hue', 'saturation');
var upres = ee.Image.cat(huesat, imageLast.select('pan')).hsvToRgb();
Map.addLayer(upres, {min: 0.07, max: [0.15, 0.15, 0.2]}, 'pansharpened (RGB) before', false);

var log = upres
  .convolve(ee.Kernel.gaussian(10, 7, 'meters')) // G
  .convolve(ee.Kernel.laplacian8(0.4)) // L of G
  
var sharpened = upres.subtract(log)
Map.addLayer(sharpened, {min: 0.07, max: [0.15, 0.15, 0.2]}, 'pansharpened (RGB) before (sharpened)');

// add pan-sharpened (RGB)
var huesat = image.select(['red', 'green', 'blue']).rgbToHsv().select('hue', 'saturation');
var upres = ee.Image.cat(huesat, image.select('pan')).hsvToRgb();
Map.addLayer(upres, {min: 0.12, max: [0.25, 0.25, 0.3]}, 'pansharpened (RGB) after', false);

var log = upres
  .convolve(ee.Kernel.gaussian(10, 7, 'meters')) // G
  .convolve(ee.Kernel.laplacian8(0.4)) // L of G
  
var sharpened = upres.subtract(log)
Map.addLayer(sharpened, {min: 0.12, max: [0.25, 0.25, 0.3]}, 'pansharpened (RGB) after (sharpened)');



// check NDVI changes
var ndvi1 = imageLast.normalizedDifference(['nir', 'red'])
var ndvi2 = image.normalizedDifference(['nir', 'red'])

Map.addLayer(ndvi1, {palette:['000000', '00ff00'],min:-0.1, max:0.6}, 'NDVI before', false)
Map.addLayer(ndvi2, {palette:['000000', '00ff00'],min:-0.0, max:0.4}, 'NDVI after', false)
Map.addLayer(ndvi2.subtract(ndvi1.multiply(0.5)), {palette:['ff0000', '00ff00'],min:-0.3, max:0.3}, 'NDVI diff', false)

// check NDWI changes
var ndwi1 = image.normalizedDifference(['green', 'nir']).unitScale(-0.3604, 0.0982)
var ndwi2 = imageLast.normalizedDifference(['green', 'nir']).unitScale(-0.5319, 0.1961)

Map.addLayer(ndwi1, {palette:['000000', 'ffffff'],min:-0.2, max:0.5}, 'NDWI before', false)
Map.addLayer(ndwi2, {palette:['000000', 'ffffff'],min:-0.2, max:0.5}, 'NDWI after', false)
Map.addLayer(ndwi2.subtract(ndwi1), {palette:['aa2020', '2020aa'],min:-0.2, max:0.2}, 'NDWI diff', false)
