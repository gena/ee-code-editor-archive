/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(Map.getCenter())
// Map.setCenter(141.53, -34.19, 13)

// adds vectors as rasters to map
var addToMapAsRaster = function(shapes, name, palette, width, opacity, filled, visible) {
  var outline = width;
  var img; 
  
  if (filled) {
    img = ee.Image().toByte();
    img = img.paint(shapes, 1); // paint fill
    img = img.paint(shapes, 0, outline + 1); // paint outline
  } else {
    img = ee.Image(0).mask(0);
    img = img.paint(shapes, 0, width);
  }

  var options = {
    palette: palette,
    max: 1,
    opacity: opacity
  };

  Map.addLayer(img, options, name, visible);

  return img;
}

addToMapAsRaster(ee.FeatureCollection(ee.Geometry(Map.getBounds(true))), 'map (white)', 'ffffff', 0, 1, true, false);

var sumAll = function (a, start, end) {
    var sum = 0;
    for (var i = start; i < end; i++)
        sum += a[i];
    return sum;
};

function otsu(histogram) {
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

/* server-side

function otsu(histogram) {
    histogram = ee.Array(histogram)
    var length = histogram.length().get([0])
    var total = histogram.slice(0, 0, length).accum(0).get([-1])

    print(length)
    print(total)
    var sum = 0;
    for (var i = ee.Number(1); i.lt(length) == 1; i = i.add(1)) {
        print(i)
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
*/

var bounds = Map.getBounds(true);

var useRealImage = false

var bandNames = ['B6','B5', 'B3', 'B4']
var images = l8.filterBounds(bounds).select(bandNames)
Map.addLayer(images, {}, 'images (raw)', false)
print(images.aggregate_count('system:index'))  

// 80%
var addPercentileImage = function(p) {
  var image = images.reduce(ee.Reducer.percentile([p])).rename(bandNames)
  Map.addLayer(image, {min:0.05, max:0.5}, 'image (' + p + '%)', false)
}

addPercentileImage(10)
addPercentileImage(20)
addPercentileImage(50)
addPercentileImage(60)
addPercentileImage(80)
addPercentileImage(90)

if(!useRealImage) {
   var image = images.reduce(ee.Reducer.percentile([10])).rename(bandNames)
  //var ndwi = image.normalizedDifference(['B5', 'B4']) // NDVI
  //var ndwi = image.normalizedDifference(['B5', 'B3']) // NDWI
  var mndwi = image.normalizedDifference(['B6', 'B3']) // MNDWI
  var ndwi = mndwi
}

// real image
var image = ee.Image(l8.filterBounds(bounds).select(['B6','B5', 'B3', 'B4', 'B2'])
  .filterMetadata('CLOUD_COVER', 'less_than', 1).first())
 
print(image)

if(useRealImage) {
  //var ndwi = image.normalizedDifference(['B5', 'B4'])
  //var ndwi = image.normalizedDifference(['B5', 'B3'])
  var mndwi = image.normalizedDifference(['B6', 'B3'])
  ndwi = mndwi
}

Map.addLayer(image, {min:0.05, max:0.5}, 'image')
Map.addLayer(image.select(['B4', 'B3', 'B2']), {min:[0.05,0.05,0.05], max:[0.2,0.2,0.4], gamma:1.2}, 'image (RGB)', false)

var ndwi_min = -1.0
var ndwi_max = 1.0
var ndwi_vis = {min: ndwi_min, max: ndwi_max}

Map.addLayer(ndwi, ndwi_vis, 'NDWI (B/W)', false)
Map.addLayer(mndwi, ndwi_vis, 'MNDWI (B/W)', false)

var style_ndwi = '\
<RasterSymbolizer>\
  <ColorMap extended="true" >\
    <ColorMapEntry color="#0000ff" quantity="-1.0" label="-1"/>\
    <ColorMapEntry color="#9ecae1" quantity="0.0" label="0"/>\
    <ColorMapEntry color="#31a354" quantity="1.0" label="1" />\
  </ColorMap>\
</RasterSymbolizer>';


Map.addLayer(ndwi.sldStyle(style_ndwi), {}, 'NDWI', false)
Map.addLayer(mndwi.sldStyle(style_ndwi), {}, 'MNDWI', false)


var bufferSize = ee.Geometry(bounds).area(600, ee.Projection("EPSG:3857")).sqrt().multiply(0.01);
print(bufferSize)
var bounds2 = ee.Geometry(bounds).buffer(-bufferSize.getInfo());


var dem = ee.Image('USGS/SRTMGL1_003');
var info = dem.getInfo()
var crs = info.bands[0].crs
var crs_transform = info.bands[0].crs_transform

var canny = ee.Algorithms.CannyEdgeDetector(ndwi.clip(bounds), 0.85, 1);
canny = canny.mask(canny).clip(bounds2)
   .reproject(crs, crs_transform)
  
Map.addLayer(canny, {min: 0, max: 1, palette: 'FF0000'}, 'canny NDWI', false);

//var cannySmallRiver = canny.focal_max(40, 'square', 'meters')
//Map.addLayer(cannyRiver.mask(cannySmallRiver), {}, 'canny max', true);

var cannyBuffer = canny.focal_max(30, 'square', 'meters');

var gaussianKernel = ee.Kernel.gaussian(120, 90, 'meters');

var ndwi_canny = ndwi.mask(cannyBuffer)
  // .convolve(gaussianKernel)
  .clip(bounds2);

print(Chart.image.histogram(ndwi, bounds2, 30, 255).setOptions({title: 'NDWI', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 }, viewWindow:{max:ndwi_min, min:ndwi_max} }}));

print(Chart.image.histogram(ndwi_canny, bounds2, 30, 255).setOptions({title: 'NDWI around canny', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 },viewWindow:{max:ndwi_min, min:ndwi_max} }}));
Map.addLayer(ndwi_canny, ndwi_vis, 'NDWI around canny', false);

var water0 = ndwi.lt(0.13)
var canny0 = ee.Algorithms.CannyEdgeDetector(water0, 0.99, 0.3);
canny0 = canny0.mask(canny0).clip(bounds2)
Map.addLayer(image.mask(water0), {min:[0.03,0.03,0.03], max:[0.4,0.4,0.3], gamma:1.5}, 'water (0)', false)
Map.addLayer(canny0.focal_max(1), {palette:'ff0000'}, 'water, NDWI=0 (boundary)', false)

// Otsu using all values
var ndwi_hist_info = ndwi.reduceRegion(ee.Reducer.histogram(255), bounds2, 30).getInfo()['nd'];
var ndwi_hist = ndwi_hist_info['histogram']
var threshold_index = otsu(ndwi_hist)
var ndwi_threshold = ndwi_hist_info['bucketMeans'][Math.round(threshold_index)];
ndwi_threshold = Math.min(ndwi_max, Math.max(ndwi_min, ndwi_threshold))
print('all: ' + ndwi_threshold)


// compute threshold
var ndwi_hist_info = ndwi_canny.reduceRegion(ee.Reducer.histogram(255), bounds2, 30).getInfo()['nd'];
var ndwi_hist = ndwi_hist_info['histogram']
var threshold_index = otsu(ndwi_hist)
var ndwi_threshold = ndwi_hist_info['bucketMeans'][Math.round(threshold_index)];

ndwi_threshold = Math.min(ndwi_max, Math.max(ndwi_min, ndwi_threshold))

print(ndwi_threshold)
  
var water = ndwi.lt(ndwi_threshold)
Map.addLayer(image.mask(water), {min:[0.03,0.03,0.03], max:[0.4,0.4,0.3], gamma:1.5}, 'water')

var canny = ee.Algorithms.CannyEdgeDetector(water, 0.99, 0.3);
canny = canny.mask(canny).clip(bounds2)
Map.addLayer(canny.focal_max(1), {palette:'aaaaff'}, 'water (boundary)')
Map.addLayer(canny, {palette:'ff0000'}, 'water (boundary), red', false)
Map.addLayer(canny, {palette:'0000ff'}, 'water (boundary), blue', false)


// print(ndwi_canny_min.reduceRegion(ee.Reducer.median(), bounds, 30))
  
/*var hist = ndwi.reduceRegion(ee.Reducer.histogram(255), bounds, 300)
print(ee.Dictionary(hist.get('nd')).get('histogram'))
*/


