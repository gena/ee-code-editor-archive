    
// Load a FeatureCollection from a Fusion Table.
var points = ee.FeatureCollection('ft:1YidZZHwwcbJEY5KcEzxdxKp5o64Y42yUI-wUQXpi');


//  US states feature class filtered to SD
var us_fc = ee.FeatureCollection('ft:1fRY18cjsHzDgGiJiS2nnpUU3v9JPDc2HNaR7Xk8');
var SD_fc = us_fc.filter(ee.Filter.eq('Name', 'South Dakota'));
var SD_geom = SD_fc.geometry(1);
var SD_bounds = SD_geom.bounds(1);
//Map.addLayer(SD_geom);
Map.addLayer(SD_fc);


var ls8SD = ee.ImageCollection('LC8_L1T_TOA')
  .filter(ee.Filter.calendarRange(4, 10, 'month'))
  .filterMetadata("CLOUD_COVER", "less_than", 30)
  .filterBounds(SD_geom);
print('SD', ls8SD);   
    

Map.setCenter(-97.893439, 45.511832, 15);
Map.addLayer(points, {}, 'From Fusion Table');


var season1 = ls8SD.filter(
                 ee.Filter.dayOfYear (91, 150)
                 ).median();
 
var season2 = ls8SD.filter(
                 ee.Filter.dayOfYear (151, 240)
              ).median();
var season3 = ls8SD.filter(
                 ee.Filter.dayOfYear (241, 300)
              ).median();

//print('season', season1);

var inBands = ["B1", "B2","B3","B4","B5","B6","B7", "B9","B10", "B11"];

// input image:
var input = ee.Image.cat(
               season1.select(inBands),
               season2.select(inBands),
               season3.select(inBands));
  
print('input', input);


  // Overlay the points on the imagery to get training.
var training = input.sampleRegions(points, ['EC0_3'], 30, "EPSG:32614");
print(training, 'training');
// Train the classifier.  
    

// Make a Random Forest classifier and train it.
var classifier = ee.Classifier.randomForest(10).setOutputMode('REGRESSION')
    .train(training, 'EC0_3');
print(classifier, 'classifier');

// Classify
var classifiedImage = input.classify(classifier);
print('Classified Image', classifiedImage);

Map.addLayer(classifiedImage);
//Map.addLayer(classifiedImage);
