/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ============================================
// CoastalMorphology/CoastlineScenes.js
// ============================================

print(Map.getCenter()); // map center for reference

// intensity limits for cloud cover scores
var I_min = 0.05;
var I_max = 0.9;

// buffer distance for "finding" real coastline
var buffer_dist = 2500; //in m

// ============================================
// 0. global functions
// ============================================

// cumulative sum function (for use in OTSU)
var sumAll = function (a, start, end) {
    var sum = 0;
    for (var i = start; i < end; i++)
        sum += a[i];
    return sum;
};

// OTSU method (reduces grayscale image to binary via clustering foreground/background)
// goal -> is to minimize intra-class variance while maximizing inter-class variance
function otsu(histogram) {
    var total = sumAll(histogram, 0, histogram.length);
    console.log(total);

    var sum = 0;
    for (var i = 1; i < histogram.length; ++i) {
        sum += i * histogram[i];
    }

    var sumB = 0;
    var wB = 0;
    var wF = 0;
    var mB;
    var mF;
    var max = 0.0;
    var between = 0.0;
    var threshold1 = 0.0;
    var threshold2 = 0.0;

    for (var j = 0; j < histogram.length; ++j) {
        wB += histogram[j];
        if (wB === 0)
            continue;

        wF = total - wB;
        if (wF === 0)
            break;
        sumB += j * histogram[j];
        mB = sumB / wB;
        mF = (sum - sumB) / wF;
        between = wB * wF * Math.pow(mB - mF, 2);
        if ( between >= max ) {
            threshold1 = j;
            if ( between > max ) {
                threshold2 = j;
            }
            max = between;            
        }
    }
    return ( threshold1 + threshold2 ) / 2.0;
}

// ============================================
// 1. load GLOBAL inputs (coastline + wrs2 path)
// ============================================

var coastline = ee.FeatureCollection('ft:1MP_HIatHwTTRltyAPrHz785VCE_XNQJ2bfvOzFx8');
var wrs2 = ee.FeatureCollection('ft:1_RZgjlcqixp-L9hyS6NYGqLaKOlnhSC35AB5M5Ll');
Map.addLayer(wrs2, {opacity: 0.5}, 'all wrs2 scenes', false); //add ALL wrs2 boxes for reference

//flag to limit analysis to map bounds (more efficient + debugging!)
var useMap = true;

if(useMap) {
  wrs2 = wrs2.filterBounds(Map.getBounds(true));
  coastline = coastline.filterBounds(Map.getBounds(true));
}

// ============================================
// 2. intersect coastline with wrs2 path boxes
// ============================================

var spatialFilter = ee.Filter.intersects({leftField: '.geo', rightField: '.geo', maxError: 10});
var saveAllJoin = ee.Join.saveAll({matchesKey: 'features'});
var intersectJoined = saveAllJoin.apply(wrs2, coastline, spatialFilter); //combine into feature collection

//function to extract clipped intersections from all intersections
var intersectedWithCount = intersectJoined.map(function(f) {
  var features = ee.List(f.get('features')); //put all intersected features into list
  var count = features.length(); //total number of intersections
  var clippedFeatures = features.map(function(f2) { 
    var clippedFeature = ee.Feature(f2).intersection(f); //intersection with wrs2 path?!?
    clippedFeature = clippedFeature.buffer(buffer_dist); //buffer result to get clipping
    return clippedFeature;
  });
  return f.set('feature_count', count).set('clipped_features', clippedFeatures);
})

//ensure all intersected scenes have features (i.e. not empty)
var allIntersectedScenes = intersectedWithCount.filter(ee.Filter.gt('feature_count', 0))
//print(allIntersectedScenes.aggregate_count('feature_count'))
Map.addLayer(allIntersectedScenes, {color: '004400', opacity: 0.5}, 'intersected wrs2 scenes'); //add to map
Map.addLayer(coastline, {color:'0000ff'}, 'coastline'); //coastline for end "goal"

// use center or first scene (with offset)
var offset = 0
var firstScene = ee.Feature(ee.List(allIntersectedScenes.toList(1, offset)).get(0));
var imageIndexOffset = 0

/*
var center = ee.Geometry.Point(59.88, 25.35)
var firstScene = ee.Feature(allIntersectedScenes.filterBounds(center).first());
var imageIndexOffset = 0
*/

var clippedFeatures = ee.FeatureCollection(ee.List(firstScene.get('clipped_features')));
Map.addLayer(firstScene, {color:'ffaaaa'}, 'first scene');
Map.addLayer(ee.FeatureCollection(ee.List(firstScene.get('features'))), {palette:'aaaaff'}, 'first scene features');
Map.addLayer(clippedFeatures, {palette:'aaaaff'}, 'first scene clipped features');

//Map.centerObject(firstScene, 7)

var bounds = clippedFeatures.geometry()    

// A mapping from a common name to the sensor-specific bands.
var LC8_BANDS = ['B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10', 'BQA'];
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp', 'BQA'];

// A helper to apply an expression and linearly rescale the output.
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

  var rescale_nir = rescale(img, 'img.nir', [1, -.1]);
  score = score.where(img.select('nir').lte(0.02),rescale_nir);

  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  
  return score.min(rescale(ndsi, 'img', [0.8, 0.6]));
};

var cloudShadowScore = function(img) {
  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  
  var rescale_nir = rescale(img, 'img.nir', [1, -.1]);
  score = score.where(img.select('nir').lte(0.02), rescale_nir);
  
  return score;
}


// Filter the TOA collection to a time-range and add the cloudscore band.
l8 = l8
    .select(LC8_BANDS, STD_NAMES)
    .map(function(img) {
      // Invert the cloudscore so 1 is least cloudy, and rename the band.
      var score = cloudScore(img);
      score = ee.Image(1).subtract(score).select([0], ['cloudscore']);
      return img.addBands(score);
    });

var images = l8.filterBounds(bounds).select(['swir1', 'nir', 'green', 'red', 'blue', 'pan', 'swir2', 'cloudscore', 'BQA'])
  .filterBounds(Map.getBounds(true))

// Define visualization parameters for a true color image.

Map.addLayer(images, {}, 'images (raw)', false)

// 80%
var addPercentileImage = function(first_y, last_y, p) {
  var image = images
    .filterDate(first_y.toString(), last_y.toString())
    .reduce(ee.Reducer.intervalMean(p, p + 1))
  
  Map.addLayer(image, {min:I_min, max: I_max}, 'image (' + p + '%) ' + first_y + '-' + last_y, false)
}

/*addPercentileImage(2013, 2014, 15);
addPercentileImage(2014, 2015, 15);
addPercentileImage(2013, 2014, 55);
addPercentileImage(2014, 2015, 55);
*/

var addImage = function(imagesList, index) {
  var image = ee.Image(ee.List(imagesList).get(index));
  Map.addLayer(image, {min:I_min, max:I_max}, index.toString(), false)


  Map.addLayer(image.select('BQA'), {palette:['000000', 'ff0000']}, index.toString() + ' BQA', false);

  var cloudscore = ee.Image(1).subtract(image.select('cloudscore'))
  Map.addLayer(cloudscore.mask(cloudscore), {palette:['ff0000', 'ff0000'], min:-0.5, max:2}, index.toString() + ' cloud score', false);
  
  var cloudShadowImage = cloudShadowScore(image)
  Map.addLayer(cloudShadowImage, {palette:['ff0000', 'ff0000'], min:-1, max:1}, index.toString() + ' cloud shadow score', false);
}

var list = images.toList(2, imageIndexOffset)
addImage(list, 0)
addImage(list, 1)
/*

if(!useRealImage) {
  var image = images.reduce(ee.Reducer.intervalMean(percentile, percentile + 1))
  image = image.select(['B6_mean','B5_mean', 'B3_mean', 'B4_mean', 'B2_mean', 'B8_mean', 'B7_mean'], ['B6','B5', 'B3', 'B4', 'B2', 'B8', 'B7'])
}
else {
  // real image
  var image = ee.Image(l8.filterBounds(bounds).select(['B6','B5', 'B3', 'B4', 'B2', 'B8', 'B7'])
    .filterMetadata('CLOUD_COVER', 'less_than', 5).first())
  
  print(image)
}

//var ndvi = image.normalizedDifference(['B5', 'B4'])
var ndwi = image.normalizedDifference(['B5', 'B3'])
var mndwi = image.normalizedDifference(['B6', 'B3'])

if(clipBounds) {
  image = image.clip(bounds)
  ndwi = ndwi.clip(bounds)
  mndwi = mndwi.clip(bounds)
  if(!useMap) {
    Map.centerObject(bounds, 12)
  }
}


Map.addLayer(image, {min:0.05, max:0.5}, 'image (swir1_nir_green)', false)

var rgb = image.select(['B6', 'B5', 'B3', 'B8'], ['red', 'green', 'blue', 'pan'])
Map.addLayer(rgb, {min:0.05, max:[max_I, max_I, max_I + 0.1], gamma:1.5}, 'image', true)
var rgb_pan = pansharpen(rgb);
Map.addLayer(rgb_pan, {min:0.05, max:[max_I, max_I, max_I + 0.1], gamma:2.5}, 'image (pan)', false)

var water_index_min = -1.0
var water_index_max = 1.0
var water_index_vis = {min: water_index_min, max: water_index_max}

var water_index_style = '\
<RasterSymbolizer>\
  <ColorMap extended="true" >\
    <ColorMapEntry color="#081dff" quantity="-1.0" label="-1"/>\
    <ColorMapEntry color="#081d58" quantity="-0.8" label="-1"/>\
    <ColorMapEntry color="#253494" quantity="-0.6" label="-1"/>\
    <ColorMapEntry color="#225ea8" quantity="-0.4" label="-1"/>\
    <ColorMapEntry color="#1d91c0" quantity="-0.2" label="-1"/>\
    <ColorMapEntry color="#41b6c4" quantity="0.0" label="-1"/>\
    <ColorMapEntry color="#7fcdbb" quantity="0.2" label="-1"/>\
    <ColorMapEntry color="#c7e9b4" quantity="0.4" label="-1"/>\
    <ColorMapEntry color="#edf8b1" quantity="0.6" label="-1"/>\
    <ColorMapEntry color="#ffffd9" quantity="1.0" label="-1"/>\
  </ColorMap>\
</RasterSymbolizer>';


var bufferSize = ee.Geometry(bounds).area(600, ee.Projection("EPSG:3857")).sqrt().multiply(0.01).getInfo();

if(!useMap) {
  bufferSize = 30;
}

print(bufferSize)
var bounds2 = ee.Geometry(bounds).buffer(-bufferSize);

var dem = ee.Image('USGS/SRTMGL1_003');
var info = dem.getInfo()
var crs = info.bands[0].crs
var crs_transform = info.bands[0].crs_transform

var detectWater = function(water_index, water_index_name, visible, show_charts) {
  Map.addLayer(water_index.sldStyle(water_index_style), {}, water_index_name, false)
  Map.addLayer(water_index, water_index_vis, water_index_name + ' (B/W)', false)

  var water0 = water_index.lt(0)
  var canny0 = ee.Algorithms.CannyEdgeDetector(water0, 0.99, 0);
  canny0 = canny0.mask(canny0).clip(bounds2)
  Map.addLayer(image.mask(water0), {min:[0.03,0.03,0.03], max:[0.4,0.4,0.3], gamma:1.5}, 'water (0)', false)
  Map.addLayer(canny0, {palette:'ff0000'}, 'water, ' + water_index_name + '=0 (boundary)', false)

  var canny = ee.Algorithms.CannyEdgeDetector(water_index.clip(bounds), 0.99, 0.7);
  canny = canny.mask(canny).clip(bounds2)
    .reproject(crs, crs_transform)
  
  Map.addLayer(canny, {min: 0, max: 1, palette: 'FF0000'}, 'canny ' + water_index_name, false);

  //var cannySmallRiver = canny.focal_max(40, 'square', 'meters')
  //Map.addLayer(cannyRiver.mask(cannySmallRiver), {}, 'canny max', true);

  var cannyBuffer = canny.focal_max(30, 'square', 'meters');

  var gaussianKernel = ee.Kernel.gaussian(120, 90, 'meters');
  var water_index_canny = water_index.mask(cannyBuffer)
  // .convolve(gaussianKernel)
  .clip(bounds2);

  if(show_charts) {
    print(Chart.image.histogram(water_index, bounds2, 30, 255).setOptions({title: water_index_name, vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 }, viewWindow:{max:water_index_min, min:water_index_max} }}));
    print(Chart.image.histogram(water_index_canny, bounds2, 30, 255).setOptions({title: water_index_name + ' around canny', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 },viewWindow:{max:water_index_min, min:water_index_max} }}));
  }
  
  Map.addLayer(water_index_canny, water_index_vis, water_index_name + ' around canny', false);

  // Otsu using all values
  var computeThreshold = function(water_index, name, bounds) {
    var hist_info = water_index.reduceRegion(ee.Reducer.histogram(255), bounds, 30).getInfo()['nd'];
    var hist = hist_info['histogram']
    var threshold_index = otsu(hist)
    var threshold = hist_info['bucketMeans'][Math.round(threshold_index)]; 
    
    threshold = Math.min(water_index_max, Math.max(water_index_min, threshold))
    
    print(water_index_name + ', ' + name + ': ' + threshold)
    
    return threshold;
  }
  
  computeThreshold(water_index, 'all', bounds2);
  var water_index_threshold = computeThreshold(water_index_canny, 'canny', bounds2);
  
  var water = water_index.lt(water_index_threshold)
  if(clipBounds) {
    water = water.clip(bounds)
  }
  
  Map.addLayer(rgb_pan.mask(water), {min:[0.03,0.03,0.03], max:[0.4,0.4,0.3], gamma:1.5}, 'water ' + water_index_name, visible)

  var canny = ee.Algorithms.CannyEdgeDetector(water, 0.99, 0);
  canny = canny.mask(canny).clip(bounds2)
  Map.addLayer(canny, {palette:'aaaaff'}, 'water (boundary) ' + water_index_name, visible)
  Map.addLayer(canny.focal_max(1), {palette:'ff0000'}, 'water (boundary), red ' + water_index_name, false)
  Map.addLayer(canny, {palette:'0000ff'}, 'water (boundary), blue ' + water_index_name, false)
  
  var url = rgb.mask(water).visualize({min:[0.03,0.03,0.03], max:[0.4,0.4,0.3], gamma:2.0}).getDownloadURL({
    name: 'water_' + percentile + '_' + featureId,
    crs: crs,
    format: 'png',
    //crs_transform: JSON.stringify(crsTransformSetStep(crs_transform[0] / 2, crs_transform)),
    crs_transform: JSON.stringify(crs_transform),
    region: JSON.stringify(bounds.coordinates().getInfo()[0]),
  });
  print(url)

  var url = water_index.getDownloadURL({
    name: 'mndwi_' + percentile + '_' + featureId,
    crs: crs,
    //crs_transform: JSON.stringify(crsTransformSetStep(crs_transform[0] / 2, crs_transform)),
    crs_transform: JSON.stringify(crs_transform),
    region: JSON.stringify(bounds.coordinates().getInfo()[0]),
  });
  print(url)
  
  var url = rgb.visualize({min:0.05, max:[max_I, max_I, max_I + 0.1], gamma:1.5}).getDownloadURL({
    name: 'swir1_nir_green_' + percentile + '_' + featureId,
    format: 'png',
    crs: crs,
    //crs_transform: JSON.stringify(crsTransformSetStep(crs_transform[0] / 2, crs_transform)),
    crs_transform: JSON.stringify(crs_transform),
    region: JSON.stringify(bounds.coordinates().getInfo()[0]),
  });
  print(url)
}

// water_index, water_index_name, visible, show_charts
//detectWater(mndwi, 'mndwi', true, true)
detectWater(ndwi, 'ndwi', false, true)


// Murray & Darling testing
Map.addLayer(grid.reduceToImage(['NDWI_NIR_GREEN_MIN_20p'], ee.Reducer.first()), {min:-0.5, max:0.5, palette: ['0000ff', 'ffffff']}, 'NDWI min 20% (pre-computed)', false);
Map.addLayer(grid.reduceToImage(['NDWI_NIR_GREEN_MIN_50p'], ee.Reducer.first()), {min:-0.5, max:0.5, palette: ['0000ff', 'ffffff']}, 'NDWI min 50% (pre-computed)', false);
Map.addLayer(grid, {}, 'grid (M&D)', false)

*/