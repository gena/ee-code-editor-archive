Map.setCenter(11.75, 45.5, 9);

// Define start and finish date of interest 
var start = ee.Date('2015-01-01');
var finish = ee.Date('2016-12-31');

var poly = ee.Geometry.Rectangle(11.464233419392258, 45.909307934788764,
                                 12.425537109375, 46.307289598592085)

// Filter collection based on geomtry, date
var filteredCollection = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
  .filterBounds(poly)
  .filter(ee.Filter.lt('CLOUD_COVER',70))
  .filterDate(start, finish);
  
var p192_28 = filteredCollection
  .filterMetadata('WRS_PATH', 'equals', 192)
  .filterMetadata('WRS_ROW', 'equals', 28);

// ========================

var ndvi = p192_28
  .map(function(i) { return i.normalizedDifference(['B5', 'B4'])})
  
var arr = ndvi.toArray();

var slope3 = arr.arraySlice(0, 1).subtract(arr.arraySlice(0, 0, -1)).arrayProject([0]) // diff
  .arrayReduce(ee.Reducer.mean(), [0]).arrayFlatten([['slope']]) // slope


// fix slope mask
slope3 = slope3
  .mask(ndvi.map(function(i) { return i.mask(); }).reduce(ee.Reducer.allNonZero()))

Map.addLayer(slope3, {min:-0.2, max:0.2}, 'slope3')













// This function gets NDVI from Landsat 8 imagery.
var addNDVI = function(image) {
  return image.addBands(image.normalizedDifference(['B5', 'B4']));
};

// Map the function over the collection.
var indicesCollection = p192_28.map(addNDVI);

// Isolate NDVI to compute Slope Index
var NDVI = ee.ImageCollection(indicesCollection.select('nd'));
print(NDVI);
Map.addLayer(NDVI,{},'NDVI Collection');

// Function to call in iterate
function stack(img, imglist) {
    imglist = ee.List(imglist)
    img = ee.Image(img)
    var diff = img.select('nd').subtract(ee.Image(imglist.get(-1)).select('nd'));
    return imglist.add(img.addBands(diff.select([0], ['diff'])))
}

var start = ee.List([ee.Image(NDVI.first())]);
var NDVI_diff = ee.ImageCollection.fromImages(ee.List(NDVI.iterate(stack, start)).slice(1)).select('diff');
print(NDVI_diff);


// Use band reducer to get the mean
var Slope = NDVI_diff.reduce(ee.Reducer.mean());
Map.addLayer(Slope, {min:-0.2, max:0.2}, 'slope');

// Compare:

// Function to call in iterate
function stack2(i1, i2) {
    // This will add a band which is the difference between successive NDVI image
    return ee.Image(i1).addBands(ee.Image(i2));
}

// Apply iterate to create an image for which the bands are successive NDVI differences
var NDVI_stack = NDVI.iterate(stack2, ee.Image());
//print(NDVI_diff);
Map.addLayer(ee.Image(NDVI_stack),{},'NDVI_diff');

// Throw away the LAST band, which is an empty image
NDVI_stack = ee.Image(NDVI_stack).slice(0,-1);
print(NDVI_stack);

// Create the difference 
var NDVI_diff2 = NDVI_stack.slice(0,-1).subtract(NDVI_stack.slice(1));
print (NDVI_diff2);

// Use band reducer to get the mean
var Slope2 = NDVI_diff2.reduce(ee.Reducer.mean());
Map.addLayer(Slope2, {min:-0.2, max:0.2}, 'slope2');

// If the same, the difference between Slope2 and Slope should be 0 everywhere

Map.addLayer(Slope2.subtract(Slope), {min:-0.2, max:0.2}, 'slope2 - slope, should be 0 everywhere');


// Function to call in iterate
function stack2(i1, i2) {
    // This will add a band which is the difference between successive NDVI image
    return ee.Image(i1).addBands(ee.Image(i2));
}

// Apply iterate to create an image for which the bands are successive NDVI differences
var NDVI_stack = NDVI.iterate(stack2, ee.Image());
//print(NDVI_diff);
Map.addLayer(ee.Image(NDVI_stack),{},'NDVI_diff');

// Throw away the LAST band, which is an empty image
NDVI_stack = ee.Image(NDVI_stack).slice(0,-1);
print(NDVI_stack);

// Create the difference 
var NDVI_diff2 = NDVI_stack.slice(0,-1).subtract(NDVI_stack.slice(1));
print (NDVI_diff2);

// Use band reducer to get the mean
var Slope2 = NDVI_diff2.reduce(ee.Reducer.mean());
Map.addLayer(Slope2, {min:-0.2, max:0.2}, 'slope2');

// If the same, the difference between Slope2 and Slope should be 0 everywhere

Map.addLayer(Slope2.subtract(Slope), {min:-0.03, max:0.03}, 'slope2 - slope, should be 0 everywhere');

Map.addLayer(Slope2.subtract(slope3), {min:-0.03, max:0.03}, 'slope3 - slope, should be 0 everywhere');
