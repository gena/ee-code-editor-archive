/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var polygon = /* color: d63000 */ee.Geometry.Polygon(
        [[[-122.5250244140625, 37.45523781879053],
          [-122.49481201171875, 37.35050947036205],
          [-122.32452392578125, 37.396346133189255],
          [-122.3931884765625, 37.49883141715704]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Load the image from the archive.
var image = ee.Image('LANDSAT/LC8_L1T/LC80440342014077LGN00');

// Define visualization parameters in an object literal.
var vizParams = {bands: ['B5', 'B4', 'B3'], min: 5000, max: 15000, gamma: 1.3};

// Center the map on the image and display.
Map.centerObject(image, 9);
Map.addLayer(image, vizParams, 'Landsat 8 false color');

// Compute the histogram of the NIR band.  The mean and variance are only FYI.
var histogram = image.select('B5').reduceRegion({
  reducer: ee.Reducer.histogram(255, 2)
      .combine('mean', null, true)
      .combine('variance', null, true), 
  geometry: polygon, 
  scale: 30
});
print(histogram);

// Chart the histogram
print(Chart.image.histogram(image.select('B5'), polygon, 30));

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

var threshold = otsu(histogram.get('B5_histogram'));

var classA = image.select('B5').lt(threshold);
Map.addLayer(classA.mask(classA), {palette: 'blue'}, 'class A');
