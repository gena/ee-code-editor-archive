var sentinel2 = ee.ImageCollection('COPERNICUS/S2')
  .filterBounds(ee.Geometry(Map.getBounds(true)).centroid(1));

Map.addLayer(sentinel2, {}, 'raw', false)

Map.addLayer(sentinel2.select(0).count(), {min: 0, max: 30, palette:['ff0000', '00ff00']}, 'count', false)

var image = ee.Image(sentinel2
  .sort('CLOUDY_PIXEL_PERCENTAGE', true)
  .toList(1, 0).get(0))
  
print(image)

var bands = ['B4', 'B3', 'B2', 'QA60'];

var dates = ee.List(sentinel2.get('date_range'));
var dateRange = ee.DateRange(dates.get(0), dates.get(1));
print('Date range: ', dateRange);

var vis = {bands:['B4','B3','B2'], min:600, max:[2000, 2000, 2800], gamma: 1.2}
Map.addLayer(image, vis, 'image');

var weights = [
  [0, -1, 0],
  [-1, 5, -1],
  [0, -1, 0],
  ];
var sharpen = ee.Kernel.fixed(3, 3, weights)
var sharpened = image.convolve(sharpen);
Map.addLayer(sharpened, vis, 'image (sharpen)', false);

var lap = image.convolve(ee.Kernel.gaussian(10, 7, 'meters')).convolve(ee.Kernel.laplacian8(0.4))
var sharpened = image.subtract(lap)
Map.addLayer(sharpened, vis, 'image (sharpen, laplacian)', false);


var cloud = image.select('QA60')
var cloud2 = cloud.focal_max(20)

var azimuth = image.get('MEAN_SOLAR_AZIMUTH_ANGLE').getInfo() * Math.PI / 180.0 + 0.5 * Math.PI;
var x = Math.round(Math.cos(azimuth)*10);
var y = Math.round(Math.sin(azimuth)*10);

var offset = 5; // this should depend on zenith / cloud height
var shadow = cloud2.changeProj(cloud2.projection(), cloud2.projection().translate(x*offset, y*offset))

shadow = shadow.mask(shadow.gt(0))
Map.addLayer(shadow, {palette: ['000000'], opacity: 0.7}, 'shadow');

Map.addLayer(cloud2, {palette: ['ffff00'], opacity: 0.5}, 'cloud (dilated)');
Map.addLayer(cloud, {palette: ['ffff00'], opacity: 0.5}, 'cloud');

Map.setCenter(3.77, 51.75, 14)
