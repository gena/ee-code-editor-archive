/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[4.376635551452637, 51.98576554445416],
          [4.3799614906311035, 51.98186699036],
          [4.393007755279541, 51.984206163536015],
          [4.389059543609619, 51.99003374163887],
          [4.376099109649658, 51.986849150068245]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(Map.getCenter())
Map.setCenter(6.03, 52.01, 16)

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

// highlight styled DEM
function hillshadeit(image, elevation, weight, height_multiplier) {
  var hsv  = image.unitScale(0, 255).rgbToHsv();

  var terrain = ee.call('Terrain', elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));
  var aspect = radians(terrain.select(['aspect']))
  var hs = hillshade(azimuth, zenith, slope, aspect)

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvToRgb();
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
print(Chart.image.histogram(ahn_ruw.clip(geometry)), geometry, 10, 100)

// load 30m DEM
var dem = ee.Image('USGS/SRTMGL1_003')
Map.addLayer(hillshadeit(dem.clip(dem.geometry()).visualize({min:dem_min, max:dem_max, palette:colors_dem}), dem, 2.0, 2.0), {}, 'SRTM', false)

var dem_smoothed = dem.resample('bilinear').reproject(ahn_ruw.projection().scale(20,20))
  .convolve(ee.Kernel.gaussian(30, 15, 'meters'))
addDem(dem_smoothed, 'SRTM_smoothed', false)



// get difference between two elevation models and plot charts
var bounds = ee.Geometry(Map.getBounds(true))

var diff = dem.subtract(ahn_ruw)
Map.addLayer(diff, {min:-10, max:10, palette: ['ff0000', 'ffffff', '0000ff']}, 'diff (SRTM - ahn_ruw)', false)

print('differences (DEM - AHN)', Chart.image.histogram(diff.clip(bounds), bounds, 10, 50)
  .setOptions({hAxis: {viewWindow:{max:-10, min:10} }}))


var diff = dem_smoothed.subtract(ahn_ruw)
Map.addLayer(diff, {min:-10, max:10, palette: ['ff0000', 'ffffff', '0000ff']}, 'diff (SRTM_smoothed - ahn_ruw)', false)

print('differences (DEM_smoothed - AHN)', Chart.image.histogram(diff.clip(bounds), bounds, 10, 50)
  .setOptions({hAxis: {viewWindow:{max:-10, min:10} }}))


Map.setOptions('SATELLITE')

// TODO: add sea water level mask (ahn_ruw <= 0), paint using {palette: ['0000ff'], opacity: 0.3}
