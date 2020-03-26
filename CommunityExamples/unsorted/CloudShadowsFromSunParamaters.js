/***
 * Estimate cloud shadows by projecting cloud mask using sun parameters.
 * 
 * @author Gennadii Donchyts (gennadiy.donchyts@gmail.com)
 * @author Ian Housman (ian.housman@gmail.com)
 * 
 */

/***
 * Projects cloud shadow from cloud mask using sun parameters.
 * 
 * @param {ee.Image} cloud mask
 * @param {number} sun azimuth in degrees
 * @param {number} shadow offset, currently empirical parameter used to scale the shadow offset
 */
function projectShadows(cloudMask, sunAzimuth, offset) {
  var azimuth = ee.Number(sunAzimuth).multiply(Math.PI).divide(180.0).add(ee.Number(0.5).multiply(Math.PI))
  var x = azimuth.cos().multiply(10.0).round();
  var y = azimuth.sin().multiply(10.0).round();
  var shadow = cloudMask.changeProj(cloudMask.projection(), cloudMask.projection().translate(x.multiply(ee.Number(offset)), y.multiply(ee.Number(offset))))

  return shadow
}

// ==================================== example

var point = ee.Geometry.MultiPoint([12.5, 41.89]);

var sentinel2 = ee.ImageCollection('COPERNICUS/S2').filterBounds(point);
var bands = ['B4', 'B3', 'B2', 'QA60'];

var image = ee.Image(sentinel2.filterDate('2016-03-15', '2016-12-31').first()).select(bands);

Map.addLayer(image, { bands:['B4','B3','B2'], min:600, max: [4000, 4000, 5000], gamma:1.5}, 'image');

var cloud = image.select('QA60')

var cloud2 = cloud.focal_max(10)
var shadow = projectShadows(cloud2, image.get('MEAN_SOLAR_AZIMUTH_ANGLE'), 5)

Map.addLayer(shadow, {palette: ['000000'], opacity: 0.7}, 'shadow');

Map.addLayer(cloud2, {palette: ['ffff00'], opacity: 0.5}, 'cloud (dilated)');
Map.addLayer(cloud, {palette: ['ffff00'], opacity: 0.5}, 'cloud');

Map.setCenter(12.5, 41.89, 12);
