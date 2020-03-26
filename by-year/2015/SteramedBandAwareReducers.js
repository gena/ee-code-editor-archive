print(Map.getCenter())

Map.setCenter(-58.56, 51.02, 8)

// Define an arbitrary region of interest as a point.
var roi = Map.getBounds(true)

// Use these bands.
var bandNames = ee.List(['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B10', 'B11']);

// Load a Landsat 8 collection.
var collection = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
  // Select the bands of interest to avoid taking up memory.
  .select(bandNames)
  // Filter to get only imagery at a point of interest.
  .filterBounds(roi)
  // Filter to get only six months of data.
  .filterDate('2014-06-01', '2014-12-31')
  // Mask clouds by mapping the cloudMask function over the collection.
  // This will add a cloud score band called 'cloud' to every image.
  .map(function(image) {
    return ee.Algorithms.Landsat.simpleCloudScore(image);
  });

Map.addLayer(collection.select('cloud'), {min: 0, max: 100}, 'cloud score', false)

// ==>

// ... implementing band-aware percentile reducer

// compute percentile using score band
var cloudPercentile = collection.select('cloud').reduce(ee.Reducer.percentile([20]))

// mask all collection members where cloud score is greater than computed percentile
var collectionPercentile = collection.map(function(image) {
  return image.mask(image.select('cloud').gte(cloudPercentile));
})

// compute mean, similar to below code, masked pixels should be excluded?
var mean = collectionPercentile.mean()

// add layers
Map.addLayer(cloudPercentile, {min: 0, max: 100}, 'cloud percentile 20%', false)
Map.addLayer(mean, {bands: ['B5', 'B4', 'B2'], min: 0, max: 0.5}, 'cloud-free mean of 20% using reducers');

Map.addLayer(collection.mean(), {bands: ['B5', 'B4', 'B2'], min: 0, max: 0.5}, 'mean', false);

// <==



// original code using Array:

// Convert the collection to an array.
var array = collection.toArray();

// Label of the axes.
var imageAxis = 0;
var bandAxis = 1;

// Get the cloud slice and the bands of interest.
var bands = array.arraySlice(bandAxis, 0, bandNames.length());
var clouds = array.arraySlice(bandAxis, bandNames.length());

// Sort by cloudiness.
var sorted = bands.arraySort(clouds);

// Get the least cloudy images, 20% of the total.
var numImages = sorted.arrayLength(imageAxis).multiply(0.2).int();

var leastCloudy = sorted.arraySlice(imageAxis, 0, numImages);

// Get the mean of the least cloudy images by reducing along the image axis.
var mean = leastCloudy.arrayReduce({
  reducer: ee.Reducer.mean(),
  axes: [imageAxis]
});

// Turn the reduced array image into a multi-band image for display.
var meanImage = mean.arrayProject([bandAxis]).arrayFlatten([bandNames]);
Map.addLayer(meanImage, {bands: ['B5', 'B4', 'B2'], min: 0, max: 0.5}, 'cloud-free 20% using Array');


