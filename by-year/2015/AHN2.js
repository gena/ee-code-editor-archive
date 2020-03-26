/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.Polygon(
        [[[4.254798888589562, 52.086557289991575],
          [4.256445760058682, 52.08652762358858],
          [4.256923191852479, 52.08694954391121],
          [4.25603272137937, 52.087898863515015],
          [4.254965185057131, 52.087625267367144],
          [4.25409615190415, 52.08704183844987]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
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
  var aspect = radians(terrain.select(['aspect']));
  var hs = hillshade(azimuth, zenith, slope, aspect);

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvtorgb();
}

var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']
//var colors_dem = ['0000ff', '00ff00']

var dem_min = 0;
var dem_max = 100;

var addDem = function(dem, name, visible) {
  var im = dem.visualize({palette:colors_dem, min:dem_min, max:dem_max, opacity: 1.0});
  Map.addLayer(hillshadeit(im, dem, 2.0, 2.0), {}, name, visible);
}

var ahn_int = ee.Image('AHN/AHN2_05M_INT')
var ahn_non = ee.Image('AHN/AHN2_05M_NON')
var ahn_ruw = ee.Image('AHN/AHN2_05M_RUW')

addDem(ahn_ruw, 'ahn_ruw', true)
addDem(ahn_int, 'ahn_int', false)


print(Chart.image.histogram(ahn_ruw.clip(geometry)), geometry, 10, 100)


var dem = ee.Image('USGS/SRTMGL1_003')
Map.addLayer(hillshadeit(dem.clip(dem.geometry()).visualize({min:dem_min, max:dem_max, palette:colors_dem}), dem, 2.0, 2.0), {}, 'dem', true)
