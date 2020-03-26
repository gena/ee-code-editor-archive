/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.Point([-120.13627052307129, 39.37564409980359]),
    geometry2 = /* color: 98ff00 */ee.Geometry.Point([-4.371185302734375, 55.259121435880246]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// A helper to apply an expression and linearly rescale the output.
var rescale = function(img, exp, thresholds) {
  return img.expression(exp, {img: img})
      .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
};

// Return the DN that maximizes interclass variance in B5 (in the region).
var otsu = function(histogram) {
  var counts = ee.Array(histogram.get('histogram'));
  var means = ee.Array(histogram.get('bucketMeans'));
  var size = means.length().get([0]);
  var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
  var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
  var mean = sum.divide(total);
  
  var indices = ee.List.sequence(1, size);
  
  // Compute between sum of squares, where each mean partitions the data.
  var bss = indices.map(function(i) {
    var aCounts = counts.slice(0, 0, i);
    var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var aMeans = means.slice(0, 0, i);
    var aMean = aMeans.multiply(aCounts)
        .reduce(ee.Reducer.sum(), [0]).get([0])
        .divide(aCount);
    var bCount = total.subtract(aCount);
    var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
    return aCount.multiply(aMean.subtract(mean).pow(2)).add(
           bCount.multiply(bMean.subtract(mean).pow(2)));
  });
  
  // Return the mean value corresponding to the maximum BSS.
  return means.sort(bss).get([-1]);
};

var bounds = ee.Geometry(Map.getBounds(true))
var boundsMask = ee.Image(0).byte().paint(bounds, 1)
var scale = 10

function maskWaterDynamic(i) {
  // compute NDWI
  var ndwi = i.normalizedDifference(['green', 'nir'])
    .multiply(boundsMask);
  //var ndwi = i.normalizedDifference(['green', 'swir1']);
    
  // detect sharp changes in NDWI
  var canny = ee.Algorithms.CannyEdgeDetector(ndwi, 0.95, 0.5)
  
  var mask = boundsMask.multiply(i.select('green').mask()).focal_min(scale*2, 'square', 'meters')
  canny = canny.multiply(mask)

  // buffer around NDWI edges
  var cannyBuffer = canny.focal_max(ee.Number(scale).multiply(1.5), 'square', 'meters');
  var ndwi_canny = ndwi.mask(cannyBuffer)
  
  // compute threshold using Otsu thresholding
  var hist = ee.Dictionary(ndwi_canny.reduceRegion(ee.Reducer.histogram(255), bounds, scale).get('nd'))
  
  var ndwi_threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0.3);
  
  var ndwi_max = 0.8;
  var ndwi_min = -0.15;
  ndwi_threshold = ee.Number(ndwi_max).min(ee.Number(ndwi_min).max(ndwi_threshold))
  
  // threshold
  var water = ndwi.gt(ndwi_threshold).rename('water')
    .set('ndwi_threshold', ndwi_threshold)

  return water;
}

function maskWaterStatic(i) {
  // compute NDWI
  var ndwi = i.normalizedDifference(['green', 'nir'])
    .multiply(boundsMask);
  //var ndwi = i.normalizedDifference(['green', 'swir1']);
  
  return ndwi.gt(0.1)
}    

// SimpleCloudScore, an example of computing a cloud-free composite with L8
// by selecting the least-cloudy pixel from the collection.

// A mapping from a common name to the sensor-specific bands.
var S2_BANDS = ['B2',   'B3',    'B4',  'B8',  'B11',    'B12'];
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2'];

// Compute a cloud score.  This expects the input image to have the common
// band names: ["red", "blue", etc], so it can work across sensors.
var cloudScore = function(img) {
  // A helper to apply an expression and linearly rescale the output.
  var rescale = function(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };

  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  // Clouds are reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));

  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));

  // Clouds are reasonably bright in all infrared bands.
  score = score.min(
      rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));

  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  return score.min(rescale(ndsi, 'img', [0.8, 0.6]));
};

function snowScore(img){
      // Compute several indicators of snowyness and take the minimum of them.
      var score = ee.Image(1.0)
      
      // Snow is reasonably bright in the blue band.
      score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));
    
      // Snow is reasonably bright in all visible bands.
      score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));
    
      // // Excluded this for snow reasonably bright in all infrared bands.
      //score = score.min(rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));
    
      // Snow is reasonably cool in temperature.
      //Changed from [300,290] to [290,275] for AK
      score = score.min(rescale(img, 'img.temp', [300, 273.15])); // start from 0C
      
      // Snow is high in ndsi.
      var ndsi = img.normalizedDifference(['green', 'swir1']);
      ndsi = rescale(ndsi, 'img', [0.5, 0.7]);
      score = score.min(ndsi);
      
      return score.clamp(0,1).toFloat()
}

// Filter the TOA collection to a time-range and add the cloudscore band.
var collection = ee.ImageCollection('COPERNICUS/S2')
    .filterBounds(Map.getBounds(true))
    .filterDate('2016-05-01', '2017-01-01')
    .map(function(img) {
      // Invert the cloudscore so 1 is least cloudy, and rename the band.
      var score = cloudScore(img.select(S2_BANDS, STD_NAMES).divide(10000));
      score = score.rename('cloudscore');
      
      return img.select(S2_BANDS, STD_NAMES)
        .addBands(score);
    });


// Define visualization parameters for a true color image.
// var vizParams = {bands: ['red', 'green', 'blue'], min:500, max: 5000, gamma: 1.5};
var vizParams = {bands: ['green', 'nir', 'green'], min:500, max: 5000, gamma: 1.5};

print(collection.aggregate_count('system:id'))

var count = 10 // collection.aggregate_count('system:id').getInfo();

var list = collection.toList(count, 0)

for(var i=0; i<count; i++) {
  var image = ee.Image(list.get(i))
  var id = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd').getInfo()
  Map.addLayer(image, vizParams, id, i===0);

  var cloud = image.select('cloudscore');
  Map.addLayer(cloud.mask(cloud), {palette:['000000', 'FFFF00']}, id + ' clouds', i===0);

  var water = maskWaterStatic(image.divide(10000)).rename('water').updateMask(cloud.lt(0.3));
  Map.addLayer(water.mask(water), {palette:['0000FF']}, id + ' water', i===0);
}



var water = collection.map(function(i) {
  var clouds = i.select('cloudscore').gt(0.1);

  var mask = boundsMask.multiply(i.select('green').mask()).multiply(i.select('nir').mask())
    .rename('mask')

  var water = maskWaterStatic(i.divide(10000)).rename('water').updateMask(clouds.not());

  return water.addBands(mask)
})



var waterOccurrence = water.select('water').sum()
  .divide(water.select('mask').sum());

var waterOccurrenceSld = '\
<RasterSymbolizer>\
  <ColorMap  type="intervals" extended="false" >\
    <ColorMapEntry color="#00ff00" quantity="0.0" label="0.0"/>\
    <ColorMapEntry color="#f7fbff" quantity="0.1" label="0.1"/>\
    <ColorMapEntry color="#deebf7" quantity="0.2" label="0.2" />\
    <ColorMapEntry color="#c6dbef" quantity="0.3" label="0.3" />\
    <ColorMapEntry color="#9ecae1" quantity="0.4" label="0.4" />\
    <ColorMapEntry color="#6baed6" quantity="0.5" label="0.5" />\
    <ColorMapEntry color="#4292c6" quantity="0.6" label="0.6" />\
    <ColorMapEntry color="#2171b5" quantity="0.7" label="0.7" />\
    <ColorMapEntry color="#08519c" quantity="0.8" label="0.8" />\
    <ColorMapEntry color="#08306b" quantity="0.9" label="0.9" />\
    <ColorMapEntry color="#000050" quantity="1.0" label="1" />\
  </ColorMap>\
</RasterSymbolizer>';

var waterOccurrenceVis = waterOccurrence.sldStyle(waterOccurrenceSld).visualize({})
  .mask(waterOccurrence)
  
  
  
Map.addLayer(waterOccurrenceVis, {}, 'water occurrence', true)
Map.addLayer(waterOccurrence, {}, 'water occurrence (raw)', false)