/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA_FMASK"),
    s2 = ee.ImageCollection("COPERNICUS/S2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Dynamic water thresholding, Donchyts et. al. 2016: http://www.mdpi.com/2072-4292/8/5/386

// Otsu thresholding
function otsu(histogram) {
  var sumAll = function (a, start, end) {
      var sum = 0;
      for (var i = start; i < end; i++)
          sum += a[i];
      return sum;
  };

  var total = sumAll(histogram, 0, histogram.length);
  console.log(total)

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
      if (wB == 0)
          continue;

      wF = total - wB;
      if (wF == 0)
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

function detectWater(images, name, method) {
  Map.addLayer(images, {}, 'images (raw) ' + name, false)

  // compute number of available images
  print('Number of cloud-free images: ', images.aggregate_count('system:index'))  
  
  // select the first image
  if(method == 'first') {
    var image = ee.Image(images.first())
  } else if(method == 'all') {
    // compute percentile
    var image = images.reduce(ee.Reducer.percentile([30])).rename(ee.Image(images.first()).bandNames())
  } else {
    throw 'Method should be all | first';
  }
   
  // print image info
  print('Image info: ', image)
  
  // compute NDWI
  var ndwi = image.normalizedDifference(WATER_BANDS)
    
  // add false-color and RGB images to map
  Map.addLayer(image, VIS_IMAGE, 'image (SNG) ' + name, false)
  Map.addLayer(image.select(['red', 'green', 'blue']), VIS_IMAGE, 'image (RGB) ' + name)
  
  // add NDWI
  var ndwi_min = -0.3
  var ndwi_max = 0.6
  var ndwi_vis = {min: ndwi_min, max: ndwi_max}
  Map.addLayer(ndwi, ndwi_vis, 'NDWI (B/W)', false)
  
  // add styled NDWI using custom stylesheet
  var style_ndwi = '\
  <RasterSymbolizer>\
    <ColorMap extended="true" >\
      <ColorMapEntry color="#31a354" quantity="-1.0" label="-1" />\
      <ColorMapEntry color="#9ecae1" quantity="0.0" label="0"/>\
      <ColorMapEntry color="#0000ff" quantity="1.0" label="1"/>\
    </ColorMap>\
  </RasterSymbolizer>';
  
  Map.addLayer(ndwi.sldStyle(style_ndwi), {}, 'NDWI', false)
  
  // detect sharp changes in NDWI
  var canny = ee.Algorithms.CannyEdgeDetector(ndwi.clip(bounds), 0.99, 2);
  canny = canny.mask(canny).clip(bounds)
  
  Map.addLayer(canny, {min: 0, max: 1, palette: 'FF0000'}, 'canny NDWI', false);
  
  // buffer around NDWI edges
  var cannyBuffer = canny.focal_max(15, 'square', 'meters');
  
  var ndwi_canny = ndwi.mask(cannyBuffer)
  
  if(Map.getScale() > 40) {
    throw 'Error: zoom in to at least 1km scale to apply dynamic thresholding'
  }

  // print NDWI on charts
  print(Chart.image.histogram(ndwi, bounds, 30, 255).setOptions({title: 'NDWI', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 }, viewWindow:{max:ndwi_min, min:ndwi_max} }}));
  
  print(Chart.image.histogram(ndwi_canny, bounds, 30, 255).setOptions({title: 'NDWI around canny', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 },viewWindow:{max:ndwi_min, min:ndwi_max} }}));
  Map.addLayer(ndwi_canny, ndwi_vis, 'NDWI around canny', false);
  
  // simple 0 thresholding
  var water0 = ndwi.gt(0)
  Map.addLayer(image.mask(water0), VIS_WATER, 'water (0)', false)
  
  // compute threshold using Otsu thresholding
  var ndwi_hist_info = ndwi_canny.reduceRegion(ee.Reducer.histogram(255), bounds, 30).getInfo()['nd'];
  var ndwi_hist = ndwi_hist_info['histogram']
  var threshold_index = otsu(ndwi_hist)
  var ndwi_threshold = ndwi_hist_info['bucketMeans'][Math.round(threshold_index)];
  
  ndwi_threshold = Math.min(ndwi_max, Math.max(ndwi_min, ndwi_threshold))
  
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

// center map to study area
print(Map.getCenter())
//Map.setCenter(141.53, -34.19, 13)

var bounds = ee.Geometry(Map.getBounds(true)).buffer(-100);

// select images

// Landsat 8
var L8_BANDS = ['B6', 'B5', 'B3', 'B4', 'B2']
var L8_NAMES = ['swir1', 'nir', 'green', 'red', 'blue']
var WATER_BANDS = ['green', 'swir1']
var VIS_IMAGE = {min:0.03, max:[0.25,0.25,0.3]}
var VIS_WATER = {min:0.03, max:0.3, gamma:1.5}
var images = l8
  .filterBounds(bounds.centroid())
  .select(L8_BANDS, L8_NAMES)
  .filterDate('2014-01-01', '2015-01-01')
  //.filterMetadata('CLOUD_COVER', 'less_than', 50)

// detectWater(images, 'Landsat 8', 'all')

// Sentinel 2
var S2_BANDS = ['B12', 'B8', 'B3', 'B4', 'B2']
var S2_NAMES = ['swir1', 'nir', 'green', 'red', 'blue']
//var WATER_BANDS = ['green', 'nir']
var WATER_BANDS = ['green', 'swir1']
var VIS_IMAGE = {min:400, max:[3500,3500,4000], gamma:1.2}
var VIS_WATER = {min:300, max:4000, gamma:1.5}
var images = s2
  .filterBounds(bounds.centroid())
  .select(S2_BANDS, S2_NAMES)
  .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', 50)

detectWater(images, 'Sentinel 2', 'all')

