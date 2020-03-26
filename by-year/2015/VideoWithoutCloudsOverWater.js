/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var aoi = /* color: d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// VideoWitoutCloudsOverWater.js

// video on all images, except when there are clouds on water pixels

var LC8_BANDS = ['B1',    'B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10', 'BQA'];
var LC7_BANDS = ['B1',    'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B8', 'B8', 'B7'];
var STD_NAMES = ['blue2', 'blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp', 'BQA'];

var useGeometry = false; 

if(!useGeometry) {
  aoi = ee.Geometry(Map.getBounds(true));
}

var ndwiThresholdMin = -0;
var ndwiThresholdMax = -0;
var ndwiThresholdReal = 0.1;
var ndwiBandsMean = ['swir1_mean', 'green_mean'];
var ndwiBands = ['swir1', 'green'];
var max_cloud_pixels_percent = ee.Number(0.20);
var averageWaterPercentileMin = 15;
var averageWaterPercentileMax = 50;

/*
var images = ee.ImageCollection('LANDSAT/LE7_L1T_TOA')
  .select(LC7_BANDS, STD_NAMES)
  .filterBounds(Map.getBounds(true))
   .sort('system:time_start')
*/

var images = 

/*
ee.ImageCollection('LC8_L1T_TOA')
  .select(LC8_BANDS, STD_NAMES)
*/  
  ee.ImageCollection(
  ee.ImageCollection('LC8_L1T_TOA')
  .select(LC8_BANDS, STD_NAMES).merge(
  ee.ImageCollection('LANDSAT/LE7_L1T_TOA')
  .select(LC7_BANDS, STD_NAMES)))
  
  .filterBounds(ee.Geometry(Map.getBounds(true)).centroid(1))
  .sort('system:time_start')

// determine water mask

var averageMin = images
   .filterDate('2013-01-01', '2014-01-01') // LC8
  //.filterDate('2009-01-01', '2012-01-01') // LC7
  .reduce(ee.Reducer.intervalMean(averageWaterPercentileMin, averageWaterPercentileMin + 1));

var averageMax = images
   .filterDate('2013-01-01', '2014-01-01') // LC8
  //.filterDate('2009-01-01', '2012-01-01') // LC7
  .reduce(ee.Reducer.intervalMean(averageWaterPercentileMax, averageWaterPercentileMax + 1));

var averageNDWIMin = averageMin.normalizedDifference(ndwiBandsMean);
Map.addLayer(averageMin.select(['swir2_mean', 'nir_mean', 'green_mean']), {min:0.05, max:0.5}, '(' + averageWaterPercentileMin + '%)', false)
Map.addLayer(averageNDWIMin, {min:-0.5, max:0.5}, 'NDWI (' + averageWaterPercentileMin + '%)', false)

var averageNDWIMax = averageMax.normalizedDifference(ndwiBandsMean);
Map.addLayer(averageMax.select(['swir2_mean', 'nir_mean', 'green_mean']), {min:0.05, max:0.5}, '(' + averageWaterPercentileMax + '%)', false)
Map.addLayer(averageNDWIMax, {min:-0.5, max:0.5}, 'NDWI (' + averageWaterPercentileMax + '%)', false)

var waterOpacity = 0.2;

var color_water_average_min = 'BB2222';
var waterAverageMin = averageNDWIMin.lt(ndwiThresholdMin);
var waterAverageVisualizedMin = waterAverageMin.mask(waterAverageMin).visualize({palette: [color_water_average_min], opacity: 0.2});

var cannyWaterAverageMin = ee.Algorithms.CannyEdgeDetector(waterAverageMin, 0.3, 2);
var cannyWaterAverageVisualizedMin = cannyWaterAverageMin.mask(cannyWaterAverageMin).focal_max(0.5).visualize({palette:[color_water_average_min], opacity:0.8});

var color_water_average_max = '22BB22';
var waterAverageMax = averageNDWIMax.lt(ndwiThresholdMax);
var waterAverageVisualizedMax = waterAverageMax.mask(waterAverageMax).visualize({palette: [color_water_average_max], opacity: 0.2});

var cannyWaterAverageMax = ee.Algorithms.CannyEdgeDetector(waterAverageMax, 0.3, 2);
var cannyWaterAverageVisualizedMax = cannyWaterAverageMax.mask(cannyWaterAverageMax).focal_max(0.5).visualize({palette:[color_water_average_max], opacity:0.8});

//Map.centerObject(polygon_clouds, 15)


var fileName = 'video_test_without_clouds_753'

// 1. generate HSV-pansharpened image
// 2. compute number of cloudy pixels within polygon
// 3. filter-out images where clouds appear within polygon_clouds
// 4. export video

var min_value = 0;
var max_value = 1;


var waterAreaScale = ee.Number(30.0);
var singlePixelArea = ee.Number(30.0*30.0);

var waterArea = ee.Number(waterAverageMin.reduceRegion(ee.Reducer.sum(), aoi, waterAreaScale).get('nd')).multiply(waterAreaScale.multiply(waterAreaScale))
print('Water Area: ', waterArea)
var waterAreaPixels = waterArea.divide(singlePixelArea)
print('Water Area Pixels: ', waterAreaPixels)
var max_cloud_pixels = waterAreaPixels.multiply(max_cloud_pixels_percent)
print('Max cloud pixels:', max_cloud_pixels)


var I_min = 0.025
var I_max = 0.4
var gamma = 1.1

var I_min_clouds = 0.2
var I_max_clouds = 0.8
var gamma_clouds = 1.1

// compute number of cloud pixels
var bad = [61440,59424,57344,56320,53248,52256,52224,49184,49152,45056,28672];
//var bad = [61440,59424,57344,56320,53248,52256,52224,49184,49152];
var maskClouds = function(img) { return img.select('BQA').eq(bad).reduce('max'); };


/*// A helper to apply an expression and linearly rescale the output.
var rescale = function(img, exp, thresholds) {
  return img.expression(exp, {img: img})
      .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
};

// Compute a cloud score.  This expects the input image to have the common
// band names: ["red", "blue", etc], so it can work across sensors.
var cloudScore = function(img) {
  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  // Clouds are reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));

  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));

  // Clouds are reasonably bright in all infrared bands.
  score = score.min(rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));

  // Clouds are reasonably cool in temperature.
  score = score.min(rescale(img, 'img.temp', [300, 290]));

  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  
  return score.min(rescale(ndsi, 'img', [0.8, 0.6]));
};

var cloudThreshold = 0.5
var maskClouds = function(img) { 
  return cloudScore(img).gt(cloudThreshold).rename(['cloud'])
};
*/


function radians(img) { return img.toFloat().multiply(Math.PI).divide(180); }

var resolution = 15;
var crs = ee.Projection('EPSG:3857'); // Web Mercator
var crs_transform = [resolution,0,0,0,resolution,0]

// load Landsat 8 imagery
var collection = images
  .map(function(image1){ // pan-sharpen
    var clouds = maskClouds(image1);
    
    var cloudPixelCount = 0;
    if(useGeometry) {
      cloudPixelCount = ee.Dictionary(clouds.reduceRegion(ee.Reducer.sum(), aoi)).get('max')
    } else {
      cloudPixelCount = ee.Dictionary(clouds.multiply(waterAverageMin).reduceRegion(ee.Reducer.sum(), aoi)).get('max')
    }
    
    var i = image1; //.mask(maskClouds(image1));

    //var rgb = image1.select('temp', 'green', 'blue').unitScale(0, max_value);
    //var rgb = image1.select('nir', 'red', 'blue').unitScale(0, max_value);
    //var rgb = i.select('swir2', 'nir', 'green').unitScale(0, max_value);
    
    var rgb = image1.select('red', 'green', 'blue').unitScale(min_value, max_value);
    rgb = rgb.addBands(rgb.select('blue').multiply(ee.Image(0.8)), ['blue'], true);

    //var rgb = image1.select('nir', 'red', 'green').unitScale(min_value, max_value);
    
    var pan = i.select('pan').unitScale(min_value, max_value);

    // Convert to HSV, swap in the pan band, and convert back to RGB.
    var hsv  = rgb.rgbtohsv();

    var intensity = pan;
    //var intensity = pan.add(hsv.select('value').multiply(0.5));

    //var swir2 = image1.select('swir2').unitScale(0, max_value);
    //var intensity = pan.add(swir2.multiply(ee.Image(0.3)));

    var huesat = hsv.select('hue', 'saturation');
    var upres = ee.Image.cat(huesat, intensity).hsvtorgb();
    
    var ndwi = image1.normalizedDifference(ndwiBands);
    var water = ndwi.lt(ndwiThresholdReal);
    var canny = ee.Algorithms.CannyEdgeDetector(water, 0.3, 3);
    
    water = water.focal_mode(4)
    // slope
    var dist = water.not().distance(ee.Kernel.euclidean(600, "meters")).int()
      .reproject(crs, crs_transform)
      .mask(water);
    var terrain = ee.call('Terrain', dist);
    var slope = radians(terrain.select(['slope']));

    upres = ee.ImageCollection.fromImages([
      upres.visualize({gamma:gamma, min:0.03, max:0.4}),
      upres.mask(water).visualize({gamma:gamma, min:0.02, max:0.2}),
      // ee.Image(0).mask(0).toByte().paint(polygon_clouds, 2, 2).visualize({palette:['AA0000','AA0000']})
                
      //upres.mask(clouds).visualize({gamma:gamma_clouds, min:[I_min_clouds,I_min_clouds,I_min_clouds], max:[I_max_clouds,I_max_clouds,I_max_clouds+0.1]}),
      
      //waterAverageVisualizedMin,
      //cannyWaterAverageVisualizedMin,
      //cannyWaterAverageVisualizedMax,
      //water.mask(water).visualize({palette: ['9090FF'], opacity: 0.1}),
      canny.mask(canny).focal_max(0.5).visualize({palette:['9090FF'], opacity:0.9}),
      //slope.visualize({opacity:0.7, palette:['ffffff','5050aa'], forceRgbOutput:true}),
    ]).mosaic()
    
    return upres.set('cloud_pixels', cloudPixelCount).addBands(clouds).addBands(image1.select('BQA'));
  });


// export video with clouds
/*Export.video(collection, 'video_test_with_clouds', {
  dimensions: '1024',
  framesPerSecond: 12,
  region: JSON.stringify(polygon.getInfo())});
*/  

// filter images with clouds over area
print('With clouds:', collection.aggregate_count('cloud_pixels')); 
collection = collection.filterMetadata('cloud_pixels', 'less_than', max_cloud_pixels);
print('Without clouds:', collection.aggregate_count('cloud_pixels'));

var firstImage = ee.Image(collection.first());
Map.addLayer(firstImage);

var firstImageClouds = firstImage.select(3);
Map.addLayer(firstImageClouds.mask(firstImageClouds), {opacity:0.6, palette: ['AA0000']}, 'clouds');

Map.addLayer(firstImage.select(4), {}, 'BQA', false);

var bounds = Map.getBounds();
var region = '[['+bounds[0]+', '+bounds[1]+'], ['+bounds[2]+', '+bounds[1]+'], ['+bounds[2]+', '+bounds[3]+'], ['+bounds[0]+', ' + bounds[3] + ']]';

var geom = ee.Geometry(Map.getBounds(true))
var coords = ee.List(geom.bounds(1, ee.Projection('EPSG:3857')).coordinates().get(0)).getInfo()
var w = Math.round((coords[1][0] - coords[0][0])/resolution)
var h = Math.round((coords[2][1] - coords[1][1])/resolution)
print(w + 'x' + h)

// export video without clouds
Export.video(collection.select([0,1,2]), fileName, {
  dimensions: w + 'x' + h,
  framesPerSecond: 5,
  region: region /*JSON.stringify(polygon.getInfo())*/ });
  
var l = collection.toList(10, 0)
Map.addLayer(ee.Image(l.get(0)), {}, '1')
Map.addLayer(ee.Image(l.get(1)), {}, '2')
Map.addLayer(ee.Image(l.get(2)), {}, '3')
Map.addLayer(ee.Image(l.get(3)), {}, '4')
Map.addLayer(ee.Image(l.get(5)), {}, '5')
Map.addLayer(ee.Image(l.get(6)), {}, '6')
Map.addLayer(ee.Image(l.get(7)), {}, '7')
  
Map.addLayer(waterAverageVisualizedMin, {}, 'water (min)', false)
Map.addLayer(cannyWaterAverageVisualizedMin, {}, 'water (min, canny)', false)

Map.addLayer(waterAverageVisualizedMax, {}, 'water (max)', false)
Map.addLayer(cannyWaterAverageVisualizedMax, {}, 'water (max, canny)', false)
