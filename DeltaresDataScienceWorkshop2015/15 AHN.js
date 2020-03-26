/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.Polygon(
        [[[4.376635551452637, 51.98576554445416],
          [4.3799614906311035, 51.98186699036],
          [4.393007755279541, 51.984206163536015],
          [4.389059543609619, 51.99003374163887],
          [4.376099109649658, 51.986849150068245]]]),
    geometry2 = /* color: 98ff00 */ee.Geometry.Polygon(
        [[[5.842834430326434, 52.132857095586225],
          [5.84515095172253, 52.13438435603762],
          [5.87073518605996, 52.138123288148066],
          [5.8518524398186855, 52.14744775551125],
          [5.831680808202464, 52.1385972162739],
          [5.840603705860872, 52.1323831075154]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(Map.getCenter())
Map.setCenter(6.03, 52.01, 17)

// comparing DEM, AHN in specific geometry over the Netherlands
var azimuth = 90;
var zenith = 60;

function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

// DEM Hillshade function - Compute hillshade for the given illumination az, el.
function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, weight, height_multiplier) {
  var hsv  = image.unitScale(0, 255).rgbtohsv();

  var terrain = ee.call('Terrain', elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));
  var aspect = radians(terrain.select(['aspect']))//.resample('bicubic');
  var hs = hillshade(azimuth, zenith, slope, aspect)//.resample('bicubic');

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvtorgb();
}

// define the colormap for the map layer
var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']

// visualization settings (elevation)
var dem_min = 0;
var dem_max = 100;

// function to visualize the specific DEM
var addDem = function(dem, name, visible) {
  var im = dem.visualize({palette:colors_dem, min:dem_min, max:dem_max, opacity: 1.0});
  Map.addLayer(hillshadeit(im, dem, 2.0, 2.0), {}, name, visible);
}


// load high resolution AHN data
var ahn_int = ee.Image('AHN/AHN2_05M_INT') //interpolated
var ahn_ruw = ee.Image('AHN/AHN2_05M_RUW') //raw

addDem(ahn_ruw, 'ahn_ruw', true)
addDem(ahn_int, 'ahn_int', false)

// histogram of data within clipped geometry
//print(Chart.image.histogram(ahn_ruw.clip(geometry)), geometry, 10, 100)

// load 30m DEM
var dem = ee.Image('USGS/SRTMGL1_003')
Map.addLayer(hillshadeit(dem.clip(dem.geometry()).visualize({min:dem_min, max:dem_max, palette:colors_dem}), dem, 2.0, 2.0), {}, 'dem', false)

var info = ahn_ruw.getInfo().bands[0]
var dem_resampled = dem.resample('bicubic').reproject(info.crs, info.crs_transform)
  .convolve(ee.Kernel.gaussian(30, 15, 'meters'))
addDem(dem_resampled, 'srtm_resampled', false)

// get difference between two elevation models
var diff = dem_resampled.subtract(ahn_ruw)
Map.addLayer(diff, {min:-10, max:10, palette: ['ff0000', 'ffffff', '0000ff']}, 'diff (srtm - ahn_ruw)', false)

ahn_int = ahn_int.updateMask(ahn_int.mask().gt(0.3))
ahn_ruw = ahn_ruw.updateMask(ahn_ruw.mask().gt(0.3))

var ahn_fill = ahn_int.unmask().reduceNeighborhood(ee.Reducer.max(), ee.Kernel.circle(25, 'meters'))
  .convolve(ee.Kernel.gaussian(5, 2, 'meters'))

ahn_int = ahn_int.unmask().add(ahn_fill.multiply(ahn_int.mask().not())).mask(ahn_int.mask().focal_max(25, 'circle', 'meters'))

addDem(ahn_int, 'ahn_int (filled)', false)

var diff_int = dem_resampled.subtract(ahn_int)
Map.addLayer(diff_int, {min:-10, max:10, palette: ['ff0000', 'ffffff', '0000ff']}, 'diff (srtm - ahn_int)', false)

var diff_int2 = ahn_ruw.subtract(ahn_int)
Map.addLayer(diff_int2, {min:-10, max:10, palette: ['ff0000', 'ffffff', '0000ff']}, 'diff (ahn_ruw-ahn_int)', false)

var srtm_corrected = dem_resampled.add(diff_int2)
addDem(srtm_corrected, 'srtm_corrected', false)

var srtm_corrected_error = srtm_corrected.subtract(ahn_ruw)
Map.addLayer(srtm_corrected_error, {min:-10, max:10, palette: ['ff0000', 'ffffff', '0000ff']}, 'diff (srtm_corrected-ahn_ruw)', false)

// difference between error before / after correction
var error_diff = diff.subtract(srtm_corrected_error)
Map.addLayer(error_diff, {min:-10, max:10, palette: ['ff0000', 'ffffff', '0000ff']}, 'improvement', false)
  
var bounds = ee.Geometry(Map.getBounds(true))
print('error_original', Chart.image.histogram(diff.clip(bounds), bounds, 10, 50)
  .setOptions({hAxis: {viewWindow:{max:-10, min:10} }}))
print('error_corrected', Chart.image.histogram(srtm_corrected_error.clip(bounds), bounds, 10, 50)
  .setOptions({hAxis: {viewWindow:{max:-10, min:10} }}))

// create smoothed version of houses + trees
var diff_int2_g = diff_int2.unmask().convolve(ee.Kernel.gaussian(90, 30, 'meters'))
Map.addLayer(diff_int2_g, {min:-10, max:10, palette: ['ff0000', 'ffffff', '0000ff']}, 'diff (ahn - ahn_int) smoothed', false)

// modify SRTM using smoothed diffs
var dem_resampled_bias = dem_resampled.subtract(diff_int2_g)
addDem(dem_resampled_bias, 'dem_resampled_bias', false)

var dem_resampled_bias_corrected = dem_resampled_bias.add(diff_int2)
addDem(dem_resampled_bias_corrected, 'srtm_corrected2', false)

var dem_resampled_bias_corrected_error = dem_resampled_bias_corrected.subtract(ahn_ruw)
Map.addLayer(dem_resampled_bias_corrected_error, {min:-10, max:10, palette: ['ff0000', 'ffffff', '0000ff']}, 'diff (srtm_corrected2-ahn_ruw)', false)

print('error_corrected2', Chart.image.histogram(dem_resampled_bias_corrected_error.clip(bounds), bounds,  10, 50)
  .setOptions({hAxis: {viewWindow:{max:-10, min:10} }}))

Map.setOptions('SATELLITE')

