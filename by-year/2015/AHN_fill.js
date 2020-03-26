/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([4.576277732849121, 51.874106432846524]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var azimuth = 90;
var zenith = 60;

function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

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

var addDem = function(dem, name, min, max, visible) {
  var im = dem.visualize({palette:colors_dem, min:min, max:max, opacity: 1.0});
  Map.addLayer(hillshadeit(im, dem, 2.0, 4.0), {}, name, visible);
}


Map.centerObject(geometry, 17)

var ahn_raw = ee.Image('AHN/AHN2_05M_RUW') // raw
var ahn_int = ee.Image('AHN/AHN2_05M_INT') // interpolated

var min = 0
var max = 30
addDem(ahn_raw, 'AHN RAW (land)', min, max, false)

addDem(ahn_int, 'AHN (land)', min, max, true)

// fill holes using max + Gaussian

// compute image to be used to fill holes
var radius = 10
var ahn_int_fill = ahn_int.unmask().multiply(ahn_int.mask().lt(1))
  .reduceNeighborhood(ee.Reducer.min(), ee.Kernel.circle(radius, 'meters')) // fill values using max
  //.convolve(ee.Kernel.gaussian(10, 8, 'meters')) // smoothen


// combine original image with the one for holes, only for holes
ahn_int_fill = ahn_int.unmask().add(ahn_int_fill.multiply(ahn_int.mask()))

addDem(ahn_int_fill, 'AHN (land) filled', min, max, true)
