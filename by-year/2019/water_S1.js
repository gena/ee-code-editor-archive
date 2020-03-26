/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry2 = /* color: #79fff8 */ee.Geometry.Polygon(
        [[[22.550125122070312, -20.612219573881028],
          [22.60162353515625, -20.614147630287725],
          [22.771224975585938, -20.545043725596198],
          [22.86155429363771, -20.48395154023161],
          [22.9339599609375, -20.414786445017914],
          [22.918846066029232, -20.359435793535884],
          [22.85053253173828, -20.35235248844008],
          [22.789812336668774, -20.379655583340586],
          [22.761690403588318, -20.406944467455208],
          [22.73852831695058, -20.435542906759977],
          [22.714927597642827, -20.452736281040764],
          [22.702997066883995, -20.459633921398144],
          [22.676219113107436, -20.470493845060087],
          [22.539825439453125, -20.519001122111014]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/


var geometry = geometry2;
var bounds = geometry;
//ALL S1 ascending covering the same area, first is for comparison of S1A to S1B - these also correspond to cloud-free S2 scenes with the same coverage

var image1 = ee.Image('COPERNICUS/S1_GRD/S1B_IW_GRDH_1SDV_20161018T170405_20161018T170430_002563_004542_CA91');
var image2 = ee.Image('COPERNICUS/S1_GRD/S1B_IW_GRDH_1SDV_20161123T170404_20161123T170429_003088_005401_FFB1');
var image3 = ee.Image('COPERNICUS/S1_GRD/S1B_IW_GRDH_1SDV_20170323T170401_20170323T170426_004838_00873B_7565');
var image4 = ee.Image('COPERNICUS/S1_GRD/S1B_IW_GRDH_1SDV_20170428T170403_20170428T170428_005363_00966B_E967');
var image5 = ee.Image('COPERNICUS/S1_GRD/S1B_IW_GRDH_1SDV_20170919T170410_20170919T170435_007463_00D2CE_623C');
var image6 = ee.Image('COPERNICUS/S1_GRD/S1B_IW_GRDH_1SDV_20171118T170410_20171118T170435_008338_00EC25_A3EB');

var pt = ee.Geometry.Point(22.682967,-20.564565); // Lake Ngami')
Map.centerObject(pt, 11);
var s1pol = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(geometry)
  .filterDate('2015-01-01', '2018-02-01')
  .filterMetadata('S1TBX_Calibration_vers','greater_than', '5.0.3')
  .filterMetadata('relativeOrbitNumber_start','equals',87);

// Function to mask out edges of images using angle
// (mask out angles <= 30.63993)
var maskAngGT30 = function(image) {
var ang = image.select(['angle']);
return image.updateMask(ang.gt(30.63993));
};
// Function to mask out edges of images using using angle
// (mask out angles >= 44.73993)
var maskAngLT45 = function(image) {
var ang = image.select(['angle']);
return image.updateMask(ang.lt(45.24));
};
// Apply angle masking functions to image collection
var s1pol = s1pol.map(maskAngGT30);
var s1pol = s1pol.map(maskAngLT45);
var image1 = maskAngGT30(image1);
var image1 = maskAngLT45(image1);
var image2 = maskAngGT30(image2);
var image2 = maskAngLT45(image2);
var image3 = maskAngGT30(image3);
var image3 = maskAngLT45(image3);
var image4 = maskAngGT30(image4);
var image4 = maskAngLT45(image4);
var image5 = maskAngGT30(image5);
var image5 = maskAngLT45(image5);
var image6 = maskAngGT30(image6);
var image6 = maskAngLT45(image6);
// Function to filter out windy days using climate forecasts
var pctWat = function(image){
var d = image.date().format('Y-M-d');
var wx = ee.ImageCollection('NOAA/CFSV2/FOR6H')
.filterDate(d);
var vWind = wx.select(['v-component_of_wind_height_above_ground']);
var a = vWind.max();
var uWind = wx.select(['u-component_of_wind_height_above_ground']);
var b = uWind.max();
var a1 = a.pow(2);
var b1 = b.pow(2);
var ab = a1.add(b1);
var ws1 = ab.sqrt();
var ws = ws1.multiply(3.6);
return image.updateMask(ws.lt(12));
};

//From Guido Lemoine's Lee Filter port in SNAP

// Functions to convert from/to dB
function toNatural(img) {
  return ee.Image(10.0).pow(img.select(0).divide(10.0));
}

function toDB(img) {
  return ee.Image(img).log10().multiply(10.0);
}
//RLEE function

function RefinedLee(img) {
  // img must be in natural units, i.e. not in dB!
  // Set up 3x3 kernels 
  var weights3 = ee.List.repeat(ee.List.repeat(1,3),3);
  var kernel3 = ee.Kernel.fixed(3,3, weights3, 1, 1, false);

  var mean3 = img.reduceNeighborhood(ee.Reducer.mean(), kernel3);
  var variance3 = img.reduceNeighborhood(ee.Reducer.variance(), kernel3);

  // Use a sample of the 3x3 windows inside a 7x7 windows to determine gradients and directions
  var sample_weights = ee.List([[0,0,0,0,0,0,0], [0,1,0,1,0,1,0],[0,0,0,0,0,0,0], [0,1,0,1,0,1,0], [0,0,0,0,0,0,0], [0,1,0,1,0,1,0],[0,0,0,0,0,0,0]]);

  var sample_kernel = ee.Kernel.fixed(7,7, sample_weights, 3,3, false);

  // Calculate mean and variance for the sampled windows and store as 9 bands
  var sample_mean = mean3.neighborhoodToBands(sample_kernel); 
  var sample_var = variance3.neighborhoodToBands(sample_kernel);

  // Determine the 4 gradients for the sampled windows
  var gradients = sample_mean.select(1).subtract(sample_mean.select(7)).abs();
  gradients = gradients.addBands(sample_mean.select(6).subtract(sample_mean.select(2)).abs());
  gradients = gradients.addBands(sample_mean.select(3).subtract(sample_mean.select(5)).abs());
  gradients = gradients.addBands(sample_mean.select(0).subtract(sample_mean.select(8)).abs());

  // And find the maximum gradient amongst gradient bands
  var max_gradient = gradients.reduce(ee.Reducer.max());
// Create a mask for band pixels that are the maximum gradient
  var gradmask = gradients.eq(max_gradient);

  // duplicate gradmask bands: each gradient represents 2 directions
  gradmask = gradmask.addBands(gradmask);

  // Determine the 8 directions
  var directions = sample_mean.select(1).subtract(sample_mean.select(4)).gt(sample_mean.select(4).subtract(sample_mean.select(7))).multiply(1);
  directions = directions.addBands(sample_mean.select(6).subtract(sample_mean.select(4)).gt(sample_mean.select(4).subtract(sample_mean.select(2))).multiply(2));
  directions = directions.addBands(sample_mean.select(3).subtract(sample_mean.select(4)).gt(sample_mean.select(4).subtract(sample_mean.select(5))).multiply(3));
  directions = directions.addBands(sample_mean.select(0).subtract(sample_mean.select(4)).gt(sample_mean.select(4).subtract(sample_mean.select(8))).multiply(4));
  // The next 4 are the not() of the previous 4
  directions = directions.addBands(directions.select(0).not().multiply(5));
  directions = directions.addBands(directions.select(1).not().multiply(6));
  directions = directions.addBands(directions.select(2).not().multiply(7));
  directions = directions.addBands(directions.select(3).not().multiply(8));

  // Mask all values that are not 1-8
  directions = directions.updateMask(gradmask);

  // "collapse" the stack into a singe band image (due to masking, each pixel has just one value (1-8) in it's directional band, and is otherwise masked)
  directions = directions.reduce(ee.Reducer.sum());  
    //var pal = ['ffffff','ff0000','ffff00', '00ff00', '00ffff', '0000ff', 'ff00ff', '000000'];
  //Map.addLayer(directions.reduce(ee.Reducer.sum()), {min:1, max:8, palette: pal}, 'Directions', false);

  var sample_stats = sample_var.divide(sample_mean.multiply(sample_mean));

  // Calculate localNoiseVariance
  var sigmaV = sample_stats.toArray().arraySort().arraySlice(0,0,5).arrayReduce(ee.Reducer.mean(), [0]);

  // Set up the 7*7 kernels for directional statistics
  var rect_weights = ee.List.repeat(ee.List.repeat(0,7),3).cat(ee.List.repeat(ee.List.repeat(1,7),4));

  var diag_weights = ee.List([[1,0,0,0,0,0,0], [1,1,0,0,0,0,0], [1,1,1,0,0,0,0], 
    [1,1,1,1,0,0,0], [1,1,1,1,1,0,0], [1,1,1,1,1,1,0], [1,1,1,1,1,1,1]]);
  var rect_kernel = ee.Kernel.fixed(7,7, rect_weights, 3, 3, false);
  var diag_kernel = ee.Kernel.fixed(7,7, diag_weights, 3, 3, false);

  // Create stacks for mean and variance using the original kernels. Mask with relevant direction.
  var dir_mean = img.reduceNeighborhood(ee.Reducer.mean(), rect_kernel).updateMask(directions.eq(1));
  var dir_var = img.reduceNeighborhood(ee.Reducer.variance(), rect_kernel).updateMask(directions.eq(1));

  dir_mean = dir_mean.addBands(img.reduceNeighborhood(ee.Reducer.mean(), diag_kernel).updateMask(directions.eq(2)));
  dir_var = dir_var.addBands(img.reduceNeighborhood(ee.Reducer.variance(), diag_kernel).updateMask(directions.eq(2)));

  // and add the bands for rotated kernels
  for (var i=1; i<4; i++) {
    dir_mean = dir_mean.addBands(img.reduceNeighborhood(ee.Reducer.mean(), rect_kernel.rotate(i)).updateMask(directions.eq(2*i+1)));
    dir_var = dir_var.addBands(img.reduceNeighborhood(ee.Reducer.variance(), rect_kernel.rotate(i)).updateMask(directions.eq(2*i+1)));
    dir_mean = dir_mean.addBands(img.reduceNeighborhood(ee.Reducer.mean(), diag_kernel.rotate(i)).updateMask(directions.eq(2*i+2)));
    dir_var = dir_var.addBands(img.reduceNeighborhood(ee.Reducer.variance(), diag_kernel.rotate(i)).updateMask(directions.eq(2*i+2)));
  }

  // "collapse" the stack into a single band image (due to masking, each pixel has just one value in it's directional band, and is otherwise masked)
  dir_mean = dir_mean.reduce(ee.Reducer.sum());
  dir_var = dir_var.reduce(ee.Reducer.sum());

  // A finally generate the filtered value
    var varX = dir_var.subtract(dir_mean.multiply(dir_mean).multiply(sigmaV)).divide(sigmaV.add(1.0));

    var b = varX.divide(dir_var);

    var result = dir_mean.add(b.multiply(img.subtract(dir_mean)));
       return(result.arrayFlatten([['sum']]));
}


function sigmatoGamma(image, angle){
  return image
    .subtract(angle.multiply(Math.PI/180.0).cos().log10().multiply(10.0));
    }
    
    
 /**
 * Convert to gamma0 (correct for viewing angle)
 * @param {ee.Image} image Multi band ee.Image (sigma0_dB)
 * @param {ee.Image} angle Image representing incidence angle
 */
function sigmatoGammaImage (image){
  var bands = image.bandNames();
  var nbands = bands.length();
  var angle = image.select('angle');
  var out = sigmatoGamma(image.select(0), ee.Image(angle));
  image.addBands(out, bands[0], true);
  if (nbands -1 > 1){
    var out2 = sigmatoGamma(image.select(1), ee.Image(angle));
    image.addBands(out2, bands[1], true);
  }
  return image;
}   
// Function to perform angle correction
function toGamma0(image) {
var vh = image.select('VH').subtract(image.select('angle')
.multiply(Math.PI/180.0).cos().log10().multiply(10.0));
return vh.addBands(image.select('VV').subtract(image.select('angle')
.multiply(Math.PI/180.0).cos().log10().multiply(10.0)));
}

//Gamma 1 stack Oct18-2015
var img_VV1 = RefinedLee(toNatural(image1.select('VV')))
print(img_VV1,'RLEE after')
var img_VH1 = RefinedLee(toNatural(image1.select('VH')))
var stack1 = img_VV1.addBands(img_VH1)
print(stack1,'stack1')
//Gamma 2 stack Nov11-2016
var img_VV2 = RefinedLee(toNatural(image2.select('VV')))
var img_VH2 = RefinedLee(toNatural(image2.select('VH')))
var stack2 = img_VV2.addBands(img_VH2)

//Gamma 3 stack Mar11-2017
var img_VV3 = RefinedLee(toNatural(image3.select('VV')))
var img_VH3 = RefinedLee(toNatural(image3.select('VH')))
var stack3 = img_VV3.addBands(img_VH3)

//Gamma 4 stack Apr28-2017
var img_VV4 = RefinedLee(toNatural(image4.select('VV')))
var img_VH4 = RefinedLee(toNatural(image4.select('VH')))
var stack4 = img_VV4.addBands(img_VH4)

//Gamma 5 stack
var img_VV5 = RefinedLee(toNatural(image5.select('VV')))
var img_VH5 = RefinedLee(toNatural(image5.select('VH')))
var stack5 = img_VV5.addBands(img_VH5)

//Gamma 6 stack
var img_VV6 = RefinedLee(toNatural(image6.select('VV')))
var img_VH6 = RefinedLee(toNatural(image6.select('VH')))
var stack6 = img_VV6.addBands(img_VH6)

/***
 * The script computes surface water mask using Canny Edge detector and Otsu thresholding
 * See the following paper for details: http://www.mdpi.com/2072-4292/8/5/386
 * 
 * Author: Gennadii Donchyts (gennadiy.donchyts@gmail.com)
 * Contributors: Nicholas Clinton (nclinton@google.com) - re-implemented otsu() using ee.Array
 */ 
 
 /***
 * Return the DN that maximizes interclass variance in B5 (in the region).
 * */

var scale = 30
var buckets = 255
var ndwi_min = -30
var ndwi_max = 0
var otsu = function(histogram) {
  var counts = ee.Array(ee.Dictionary(histogram).get('histogram'));
  var means = ee.Array(ee.Dictionary(histogram).get('bucketMeans'));
  var size = means.length().get([0]);
  var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
  var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
  var mean = sum.divide(total);
  
  var indices = ee.List.sequence(1, size);
  print(indices);
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
  var charts1 = ui.Chart.array.values(ee.Array(bss), 0, means);
  print(bss);
  print(charts1);
  
  // Return the mean value corresponding to the maximum BSS.
  return means.sort(bss).get([-1]);
};
var hand = ee.Image("users/gena/GlobalHAND/30m/hand-5000");
var handMask = hand.gt(30)

var thresholding = require('users/gena/packages:thresholding')
var utils = require('users/gena/packages:utils')

Map.addLayer(img_VV1, {min: 0.03, max: 0.3}, 'img_VV1')

// // additionally apply Perona-Malik smoothing
img_VV1 = utils.peronaMalikFilter(img_VV1, 10, 3.5, 1)
Map.addLayer(img_VV1, {min: 0.03, max: 0.3}, 'img_VV1 (after PM)', false)

// detect threshold around edges within AOI
var scale = 20
var bounds = geometry2
var cannyThreshold = 0.05
var cannySigma = 0
var minValue = 0
var debug = true
var minEdgeLength = 50 // pixels

var th = thresholding.computeThresholdUsingOtsu(img_VV1, scale, geometry2, cannyThreshold, cannySigma, minValue, debug, minEdgeLength)

var water = img_VV1.mask(img_VV1.lt(th)).clip(geometry2)

Map.addLayer(water.mask(ee.Image(1).subtract(water.unitScale(0, th))), {palette:['6baed6']}, 'water', true, 0.5)


/*

var hist = toDB(img_VV1).clip(geometry);
var hist1 = ee.Dictionary(ee.Dictionary(hist.reduceRegion(ee.Reducer.histogram(buckets), bounds, scale)).values().get(0));


// print(hist1);
// var threshold = otsu(hist1);  

//   //ndwi_threshold = ee.Number(ndwi_max).min(ee.Number(ndwi_min).max(ndwi_threshold))
//   print('Detected threshold: ', threshold);
// var h

 var canny = ee.Algorithms.CannyEdgeDetector(hist.clip(bounds), 0.7, 0.5);
  canny = canny.mask(handMask.not())
  canny = canny.updateMask(canny).clip(bounds)
  var cannyBuffer = canny.focal_max(ee.Number(scale).multiply(1.5), 'square', 'meters');
    var ndwi_canny = hist.mask(cannyBuffer)
print(ui.Chart.image.histogram(hist, bounds, scale, 255).setOptions({title: 'NDWI', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 }, viewWindow:{max:ndwi_min, min:ndwi_max} }}));
print(ui.Chart.image.histogram(ndwi_canny, bounds, scale, 255).setOptions({title: 'NDWI around canny', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 },viewWindow:{max:ndwi_min, min:ndwi_max} }}));
Map.addLayer(ndwi_canny, {}, 'NDWI around canny', false);
  // compute threshold using Otsu thresholding
  var hist = ndwi_canny.reduceRegion(ee.Reducer.histogram(255), bounds, scale)
  print(hist, 'hist info');
  var ndwi_threshold = otsu(hist.get('sum'));
  ndwi_threshold = ee.Number(ndwi_max).min(ee.Number(ndwi_min).max(ndwi_threshold))
  print('Detected NDWI threshold: ', ndwi_threshold)
  
var threshed = toDB(img_VV1.clip(geometry)).lte(ndwi_threshold)  



Map.addLayer(threshed, {}, 'OTSU threshold test #1');
*/