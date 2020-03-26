/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var hyderabad = /* color: #d63000 */ee.Geometry.Point([78.45748901367188, 17.397165973510052]),
    srtm = ee.Image("USGS/SRTMGL1_003");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// client-side profiling
function profile(f) {
  var t0 = new Date()
  
  f.getInfo(function(f) {
    var t1 = new Date()
    
    var elapsed = t1.getTime() - t0.getTime()
    
    print(elapsed)
    //print('Elapsed time: ' + elapsed + 'ms')
  })
  
  return f
}

function delay(millis) {
  var before = Date.now();
  while (Date.now() < before + millis) {};
}

var fc = ee.FeatureCollection("ft:1fWY4IyYiV-BA5HsAKi2V9LdoQgsbFtKK2BoQiHb0");
fc = fc.limit(100)

function f() {
  // Load a Landsat 8 collection.
  var collection = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
    // Filter by date and location.
    //.filterBounds(hyderabad)
    //.filterBounds(fc)
    .filterDate('2014-01-01', '2014-03-30')
    // Sort by increasing cloudiness.
    //.sort('CLOUD_COVER');
    
  
  // Compute the median of each pixel for each band
  var median = collection.reduce(ee.Reducer.median());
//  var median = srtm
  
  var seed = 2014;
  var polygons = fc.randomColumn('random', seed);
  
  var regionsOfInterest = median.sampleRegions({
      collection: polygons,
      properties: ['class', 'random'],
      scale: 30
  });
  
  profile(regionsOfInterest)
}

// call function 10 times
ee.List.sequence(0, 20).getInfo().map(function(i) {
  f()

  //delay(400)
  
})

return



Export.table.toDrive({
  collection: regionsOfInterest, 
  description: 'regions_of_interest',
  fileFormat: 'GeoJSON'
});


var training = regionsOfInterest.filterMetadata('random', 'less_than', 0.7);
var testing = regionsOfInterest.filterMetadata('random', 'not_less_than', 0.7);

//print('training count:', training.size());
//print('testing count:', testing.size());

var classifier = ee.Classifier.randomForest({
    numberOfTrees: 100,
});

var bands = median.bandNames();

var bandsrgb = ['B4_median', 'B2_median', 'B3_median'];

// Test the classifiers' accuracy. (data, y, X)
var trainingClassifier = classifier.train(training, 'class', bands);
var validation = testing.classify(trainingClassifier);

var errorMatrix = validation.errorMatrix('class', 'classification');

print(errorMatrix.accuracy());
print(trainingClassifier.confusionMatrix().array());



// Load a Landsat 8 collection.
var bcollection = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
  // Filter by date and location.
  .filterBounds(hyderabad)
  .filterDate('2014-01-01', '2014-5-31')
  // Sort by increasing cloudiness.
  .sort('CLOUD_COVER');

// Compute the median of each pixel for each band of the 5 least cloudy scenes.
var hyd = bcollection.limit(1).reduce(ee.Reducer.median());

print(hyd);



// Classify the image.
var classified = hyd.classify(trainingClassifier);


// Create a palette to display the classes.
var palette =['006400', '32CD32', 'EEE8AA',
              '8B4513', '98FB98', '00FA9A',
              '90EE90', '00008B', 'FF8C00',
              'ADFF2F', '808080'];

// Display the classification result and the input image.
Map.addLayer(classified, {min: 0, max: 3, palette: palette}, 'Urbanization');

