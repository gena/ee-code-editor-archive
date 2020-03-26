/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    geometry = /* color: d63000 */ee.Geometry.MultiPoint(),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bounds = Map.getBounds(true)

var bands = ['B8', 'B3', 'B4', 'B2']
var bandNames = ['nir', 'green', 'red', 'blue']
var minImage = 800
var maxImage = [4500,4500,5000]
var minWater = 800
var maxWater = [4000,4000,2000]
var WATER_BANDS = ['green', 'nir']
var scale = 10

var image = ee.Image(s2.filterBounds(bounds).select(bands).reduce(ee.Reducer.percentile([35]))).rename(bandNames)
Map.addLayer(image, {bands: ['red', 'green', 'blue'], min:800, max:[3000, 3000, 3500]}, 'S2 35%')

/*
var index = 11
var image = ee.Image(s2.filterBounds(bounds).toList(1, index).get(0))
Map.addLayer(image, {bands: ['red', 'green', 'blue'], min:500, max:3000, gamma: 1.2}, 'S2')
*/

var bands = ['B5', 'B3', 'B4', 'B2', 'B8']
var bandNames = ['nir', 'green', 'red', 'blue', 'swir1']
var minImage = 0.03
var maxImage = [0.4,0.4,0.5]
var minWater = 0.03
var maxWater = [0.2,0.2,0.1]
var WATER_BANDS = ['green', 'nir']
var scale = 90

var image = ee.Image(l8.filterBounds(bounds).filterDate('2015-01-01', '2015-09-01').select(bands)
.reduce(ee.Reducer.percentile([35]))).rename(bandNames)
Map.addLayer(image, {bands: ['red', 'green', 'blue'], min:minImage, max:maxImage}, 'L8 35% (RGB)')
Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min:minImage, max:maxImage}, 'L8 35% (SNG)', false)

/*
var index = 0
var image = ee.Image(l8.filterBounds(bounds).toList(1, index).get(0)).select(bands, bandNames)
Map.addLayer(image, {bands: ['red', 'green', 'blue'], min:minImage, max:maxImage}, 'L8')
*/

var VIS_IMAGE = {min:minImage, max:maxImage}
var VIS_WATER = {min:minWater, max:maxWater}


var ndwi = image.normalizedDifference(['green', 'swir1'])

Map.addLayer(ndwi, {min:-0.1, max:0.5}, 'NDWI', false)


// Dynamic water thresholding, http://www.mdpi.com/2072-4292/8/5/386

// Return the DN that maximizes interclass variance in B5 (in the region).
var otsu = function(histogram) {
  var counts = ee.Array(ee.Dictionary(histogram).get('histogram'));
  var means = ee.Array(ee.Dictionary(histogram).get('bucketMeans'));
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
  
  print(ui.Chart.array.values(ee.Array(bss), 0, means));
  
  // Return the mean value corresponding to the maximum BSS.
  return means.sort(bss).get([-1]);
};

function detectWater() {
  // print image info
  print('Image info: ', image)
  
  // compute NDWI
  var ndwi = image.normalizedDifference(WATER_BANDS)
    
  // add false-color and RGB images to map
  Map.addLayer(image, VIS_IMAGE, 'image (SNG)', false)
  Map.addLayer(image.select(['red', 'green', 'blue']), VIS_IMAGE, 'image (RGB)', false)
  
  // add NDWI
  var ndwi_min = -0.3
  var ndwi_max = 0.6
  var ndwi_vis = {min: ndwi_min, max: ndwi_max}
  Map.addLayer(ndwi, ndwi_vis, 'NDWI (B/W)', false)
  
  // detect sharp changes in NDWI
  var canny = ee.Algorithms.CannyEdgeDetector(ndwi.clip(bounds), 0.7, 0.5);
  canny = canny.mask(canny).clip(bounds)
  
  Map.addLayer(canny, {min: 0, max: 1, palette: 'FF0000'}, 'canny NDWI', false);
  
  // buffer around NDWI edges
  var cannyBuffer = canny.focal_max(ee.Number(scale).multiply(1.5), 'square', 'meters');
  
  var ndwi_canny = ndwi.mask(cannyBuffer)
  
  if(Map.getScale() > 400) {
    throw 'Error: zoom in to at least 1km scale to apply dynamic thresholding'
  }

  // print NDWI on charts
  print(Chart.image.histogram(ndwi, ee.Geometry(bounds), scale, 255).setOptions({title: 'NDWI', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 }, viewWindow:{max:ndwi_min, min:ndwi_max} }}));
  
  print(Chart.image.histogram(ndwi_canny, ee.Geometry(bounds), scale, 255).setOptions({title: 'NDWI around canny', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 },viewWindow:{max:ndwi_min, min:ndwi_max} }}));
  Map.addLayer(ndwi_canny, ndwi_vis, 'NDWI around canny', false);
  
  // simple 0 thresholding
  var water0 = ndwi.gt(0)
  Map.addLayer(image.mask(water0), VIS_WATER, 'water (0)', false)
  
  // compute threshold using Otsu thresholding
  var hist = ndwi_canny.reduceRegion(ee.Reducer.histogram(255), bounds, scale)
  var ndwi_threshold = otsu(hist.get('nd'));
  ndwi_threshold = ee.Number(ndwi_max).min(ee.Number(ndwi_min).max(ndwi_threshold))
  print('Detected NDWI threshold: ', ndwi_threshold)

  // show water mask
  var water = ndwi.gt(ndwi_threshold)
  Map.addLayer(image.mask(water), VIS_WATER, 'water')
  
  // show edge around water mask
  var canny = ee.Algorithms.CannyEdgeDetector(water, 0.99, 0.3);
  canny = canny.mask(canny)
  Map.addLayer(canny, {palette:'aaaaff'}, 'water (boundary)')
  Map.addLayer(canny, {palette:'000000'}, 'water (boundary) black', false)
}

detectWater()






function experimentalAlgorithms() {
  var training = image.sample({region: bounds, scale: scale, numPixels: 5000})
  var clusterer = ee.Clusterer.wekaKMeans(50).train(training)
  
  var result = image.cluster(clusterer)
  Map.addLayer(result.randomVisualizer(), {}, 'clusters (k-means)', false)
  
  // region growing
  var maxObjectSize = 100;
  // The RegionGrow algorithm has these arguments:
  // threshold - The maximum distance for inclusion in the current cluster.
  // useCosine - Whether to use cosine distance instead of euclidean distance
  //     when computing the spectral distance.
  // secondPass - Apply a refinement pass to the clustering results.
  var imageClustered = ee.apply("Test.Clustering.RegionGrow", 
    {  "image": image
     , "useCosine": true
     , "threshold": 0.001
     , "maxObjectSize": maxObjectSize
  , });
  
  var imageConsistent = ee.apply("Test.Clustering.SpatialConsistency", {
     "image": imageClustered
     , "maxObjectSize": maxObjectSize
  });
  
  var clusterImage = imageConsistent.select('clusters')
  Map.addLayer(clusterImage.randomVisualizer(), {}, "clusters (region growing)", false);
}

experimentalAlgorithms();
