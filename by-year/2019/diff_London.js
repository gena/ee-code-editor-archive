/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var boundaries = ee.FeatureCollection("users/breadboard/gla/London_Ward_CityMerged");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var images = require('users/gena/packages:assets')
  .getImages(Map.getBounds(true), true, {
    filter: ee.Filter.date('2015-07-01', '2018-01-01')
    //only: ['S2']
  })
  
  .select(['swir', 'nir','red'])
  
print(ui.Chart.feature.byFeature(images, 'system:time_start', ['SUN_ELEVATION', 'SUN_AZIMUTH']).setChartType('ScatterChart').setOptions({pointSize: 2}))  

var images2016 = images.filterDate('2016-03-01', '2016-10-01')
var images2017 = images.filterDate('2017-03-01', '2017-10-01')

print(images2016)
print(images2017)

function computeNdvi(i) {
  return i.normalizedDifference(['red', 'nir']).clamp(-0.15, 0.15)
}

var p = 50

Map.addLayer(images2016.reduce(ee.Reducer.percentile([p])), {min:0.05, max:0.3}, '2016')
Map.addLayer(images2017.reduce(ee.Reducer.percentile([p])), {min:0.05, max:0.3}, '2017')

var ndvi2016 = images2016.map(computeNdvi).reduce(ee.Reducer.percentile([p]))
var ndvi2017 = images2017.map(computeNdvi).reduce(ee.Reducer.percentile([p]))

var diff = ndvi2017.subtract(ndvi2016)

var colorbrewer = require('users/gena/packages:colorbrewer')

Map.addLayer(diff.mask(diff.abs().add(0.3).multiply(2)), {min:-0.1, max:0.1, palette: colorbrewer.Palettes.RdYlGn[5].reverse()}, '2017-2016')

/*
//load in Sentinel data
var maxCloudPercent = 10;
var areaOfInterest = boundaries.geometry().bounds();
var centrePoint = areaOfInterest.centroid(1);
print(centrePoint.coordinates());
Map.setCenter(-0.08657038934710998, 51.48944510648);
var summer2016Collection = ee.ImageCollection('COPERNICUS/S2').filterBounds(areaOfInterest).filterMetadata('CLOUDY_PIXEL_PERCENTAGE',"less_than",  maxCloudPercent).filterDate('2016-05-01', '2016-08-31');
var summer2017Collection = ee.ImageCollection('COPERNICUS/S2').filterDate('2017-05-01', '2017-08-31').filterBounds(areaOfInterest).filterMetadata('CLOUDY_PIXEL_PERCENTAGE',"less_than", maxCloudPercent);


var images = ee.ImageCollection('COPERNICUS/S2')
  .filterDate('2016-01-01', '2018-01-01')
  .filter(ee.Filter.dayOfYear(90, 330))
  .map(function(i) { return i.normalizedDifference(['B8', 'B4'])})
  .



Map.addLayer(boundaries, {}, 'area of interest');

//outout some info on the images being used
print("2016 images ", summer2016Collection.sort('system:time_start', false).limit(30));
print("2017 images ", summer2016Collection.sort('system:time_start', false).limit(30));
var size2016 = summer2016Collection.size();
print('Number of 2016 images: ', size2016);
var size2017 = summer2017Collection.toList(100).length();
print('Number of 2017 images: ', size2017);
var dates2016 = ee.List(summer2016Collection.get('date_range'));
print("Dates 2016",  dates2016 );
var dateRange2016 = ee.DateRange(dates2016.get(0), dates2016.get(1));
print('Date range 2016: ', dateRange2016);
var dates2017 = ee.List(summer2017Collection.get('date_range'));
print("Dates 2016",  dates2017 );
var dateRange2017 = ee.DateRange(dates2017.get(0), dates2017.get(1));
print('Date range 2017: ', dateRange2017);


//reduce imagery
var summer2016 = summer2016Collection.reduce(ee.Reducer.median());
var summer2017 = summer2017Collection.reduce(ee.Reducer.median());

//add layers
Map.addLayer(summer2016, {bands: ['B4_median', 'B3_median', 'B2_median'], max: [3000, 3000, 3000]}, 'Summer 2016');
Map.addLayer(summer2017, {bands: ['B4_median', 'B3_median', 'B2_median'], max: [3000, 3000, 3000]}, 'Summer 2017');

var applyViMeasure = function(image) {
  //evi
  // return image.expression(
  //       '2.5*(B8 - B4) / (B8 + 6*B4 - 7.5*B2 + 1)', {
  //         'B2': image.select('B2'),
  //         'B4': image.select('B4'),
  //         'B8': image.select('B8'),
  //   });
  
  var ndvi = image.normalizedDifference(['B8_median', 'B4_median']);
  //tvdi https://www.harrisgeospatial.com/docs/broadbandgreenness.html#Leaf
  // var tdvi = ndvi.add(0.5);
  // tdvi = tdvi.sqrt().rename('tdvi');
  // return tdvi;
  return ndvi.rename('vi');
}

//calculate vi
var vi2016 = applyViMeasure(summer2016);
var vi2017 = applyViMeasure(summer2017);
//visualise the vi layers
var vi_palette =
     'FFFFFF, CE7E45, DF923D, F1B555, FCD163, 99B718, 74A901, 66A000, 529400,' + '3E8601, 207401, 056201, 004C00, 023B01, 012E01, 011D01, 011301';
Map.addLayer(vi2016, {min: 0, max: 1.0, palette: vi_palette}, 'vi-2016', false);
Map.addLayer(vi2017, {min: 0, max: 1.0, palette: vi_palette}, 'vi-2017', false);


//detect changes
var diff = vi2017.subtract(vi2016);

//visualise the differences
Map.addLayer(diff,
    {palette: 'FF0000, 000000, 00FF00', min: -0.3, max: 0.3}, 'vi-diff', false);
    

var diffThreshold = 0.3;
//mask our and visualise major changes
var majorLosses = diff.mask(diff.lt(-diffThreshold));
var majorGains = diff.mask(diff.gt(diffThreshold));
Map.addLayer(majorLosses,
    {palette: 'FF0000, 000000, 00FF00', min: -diffThreshold, max: diffThreshold}, 'vi-loss');

Map.addLayer(majorGains,
    {palette: 'FF0000, 000000, 00FF00', min: -0.3, max: 0.3}, 'vi-gains');


//experiement with mean VI as a Green Infrastructure measure
    
var calculateBoundaryGIscores = function(targetImage) {
    var wardsWithCanopyScore = targetImage.select('vi').reduceRegions({
      collection: boundaries,
      reducer: ee.Reducer.mean().setOutputs(['mean_vi']),
      scale: 10.0,
    });
    return wardsWithCanopyScore;
}
    
var boundariesWithGI_2016 = calculateBoundaryGIscores(vi2016);
var boundariesWithGI_2017 = calculateBoundaryGIscores(vi2017);
print(boundariesWithGI_2016)

var visualiseGiScores = function(boundaryCollection) {
  var empty = ee.Image();
  var vis_boundaries = empty.paint({
    featureCollection: boundaryCollection,
    color: 'mean_vi'
  });
  return vis_boundaries;
}

var visGiScore2016 = visualiseGiScores(boundariesWithGI_2016);
var visGiScore2017 = visualiseGiScores(boundariesWithGI_2017);

var vi_palette =
    'FFFFFF, CE7E45, DF923D, F1B555, FCD163, 99B718, 74A901, 66A000, 529400';
Map.addLayer(visGiScore2016, {min: -1, max: 1, palette: vi_palette}, 'GI scores 2017', false);
Map.addLayer( visGiScore2017, {min: -1, max: 1, palette: vi_palette}, 'GI scores 2017', false);
*/