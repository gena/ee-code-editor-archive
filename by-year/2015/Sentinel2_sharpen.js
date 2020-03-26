/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.Polygon(
        [[[5.2329249304555105, 53.242516169614824],
          [5.276699066160177, 53.242618967696174],
          [5.277042453307104, 53.26038717364975],
          [5.233096507614164, 53.26028448775644]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Computes export video / image parameters: scale, rect.
 */
function generateExportParameters(bounds, w, h) {
  bounds = ee.Geometry(bounds).bounds()
  w = ee.Number(w)
  h = ee.Number(h)
  
  // get width / height
  var coords = ee.List(bounds.coordinates().get(0))
  var ymin = ee.Number(ee.List(coords.get(0)).get(1))
  var ymax = ee.Number(ee.List(coords.get(2)).get(1))
  var xmin = ee.Number(ee.List(coords.get(0)).get(0))
  var xmax = ee.Number(ee.List(coords.get(1)).get(0))
  var width = xmax.subtract(xmin)
  var height = ymax.subtract(ymin)

  // compute new height, ymin, ymax and bounds
  var ratio = w.divide(h)
  var ycenter = ymin.add(height.divide(2.0))

  height = width.divide(ratio)
  ymin = ycenter.subtract(height.divide(2.0))
  ymax = ycenter.add(height.divide(2.0))
  
  bounds = ee.Geometry.Rectangle(xmin, ymin, xmax, ymax)
  
  var scale = bounds.projection().nominalScale().multiply(width.divide(w))

  return {scale: scale, bounds: bounds}  
}

var bands = ['B4', 'B3', 'B2'];
//var bands = ['B11', 'B8', 'B3'];

var vis = {bands:bands, min:600, max:[4000, 4000, 4000], gamma: 1.2}


var sentinel2 = ee.ImageCollection('COPERNICUS/S2')
  //.filterBounds(ee.Geometry(Map.getBounds(true)).centroid(1))
  .filterBounds(geometry.centroid(1))
  .sort('system:time_start');

var image = ee.Image(sentinel2
  .sort('CLOUDY_PIXEL_PERCENTAGE', true)
  .toList(100, 0).get(0))
  
Map.addLayer(image, vis, 'image');

var weights = [[0, -1, 0], [-1, 5, -1], [0, -1, 0],];
var sharpen = ee.Kernel.fixed(3, 3, weights)
var sharpened = image.convolve(sharpen);
Map.addLayer(sharpened, vis, 'image (sharpen)', false);

var lap = image.convolve(ee.Kernel.gaussian(10, 7, 'meters')).convolve(ee.Kernel.laplacian8(0.4))
var sharpened = image.subtract(lap)
Map.addLayer(sharpened, vis, 'image (sharpen, laplacian)', true);

// Map.setCenter(3.77, 51.74, 14)

// export video (cloud-free over polygon)

// band names: ["red", "blue", etc], so it can work across sensors.
var cloudScore = function(img) {
  // A helper to apply an expression and linearly rescale the output.
  var rescale = function(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };

  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  // Clouds are reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));

  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));

  // Clouds are reasonably bright in all infrared bands.
  score = score.min(
      rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));

  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  return score.min(rescale(ndsi, 'img', [0.8, 0.6]));
};

// A mapping from a common name to the sensor-specific bands.
var SENTINEL_BANDS = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'];
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2'];

// Filter the TOA collection to a time-range and add the cloudscore band.
var sentinel2 = ee.ImageCollection('COPERNICUS/S2')
    .filterBounds(geometry)
    .map(function(img) {
      // Invert the cloudscore so 1 is least cloudy, and rename the band.
      var score = cloudScore(img.unitScale(500, 5000).select(SENTINEL_BANDS, STD_NAMES)).rename('cloudscore');

      var lap = img.convolve(ee.Kernel.gaussian(10, 7, 'meters')).convolve(ee.Kernel.laplacian8(0.4))
      var sharpened = img.subtract(lap)
      img = sharpened

      return img.addBands(score)
        .set('cloud_count', score.gt(0.3).reduceRegion(ee.Reducer.sum(), geometry, 10).get('cloudscore'))
        .set('geometry_containted', geometry.containedIn(img.select(0).geometry(), ee.ErrorMargin(1)))
        .set('time', img.get('system:time_start'));
    })
    .filter(ee.Filter.lt('cloud_count', 20000))
    .filter(ee.Filter.eq('geometry_containted', true));

Map.addLayer(sentinel2.count(), {}, 'count', false);  

var name = 'NL_Griend_false';

var w = 1280
var h = 720
var params = generateExportParameters(Map.getBounds(true), w, h)
var bounds = params.bounds
var scale = params.scale.getInfo()

Export.video(sentinel2.map(function(i) { return i.visualize(vis) }), name, {
  crs: 'EPSG:4326',
  region: bounds,
  scale: scale,
  driveFileNamePrefix: name,
  framesPerSecond:5
})


var count = 16;
var images = sentinel2.toList(count,0);

for(var i=0; i<count; i++) {
  var im = ee.Image(images.get(i))
  Map.addLayer(im, vis, i.toString(), false)  
  Map.addLayer(im.select('cloudscore'), {min:-1, max:1}, i.toString() + ' clouds', false)  
  //print(im.get('cloud_count'))
  //print(ee.Date(im.get('time')))
}

var image = ee.Image(sentinel2
  .sort('CLOUDY_PIXEL_PERCENTAGE', true)
  .toList(100, 0).get(0))


