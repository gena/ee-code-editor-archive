/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var dem = ee.Image("AHN/AHN2_05M_RUW");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, weight, height_multiplier, azimuth, zenith) {
  var hsv  = image.unitScale(0, 255).rgbtohsv();

  var terrain = ee.Algorithms.Terrain(elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));

  var aspect = radians(terrain.select(['aspect'])).resample('bicubic');
  var hs = hillshade(azimuth, zenith, slope, aspect).resample('bicubic');
  
  Map.addLayer(slope, {}, 'slope', false)
  Map.addLayer(aspect, {}, 'apect', false)
  Map.addLayer(hs, {}, 'hs', false)

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');

  return ee.Image.cat(huesat, intensity).hsvtorgb();
}


var palette = ['d8b365', 'f5f5f5', '5ab4ac']
var demMin = -100
var demMax = 20
Map.addLayer(dem, {palette: palette, min: demMin, max: demMax}, 'DEM', false)


var demWeight = 1.5 // dem vs hs
var heightMultiplier = 3
var demAzimuth = 0
var demZenith = 25
Map.addLayer(hillshadeit(dem.visualize({palette: palette, min: demMin, max: demMax}), dem, 
  demWeight, heightMultiplier, demAzimuth, demZenith), {}, 'DEM (hillshade)')


// Map.addLayer(ee.Image(1).mask(0.3), {palette: ['000000']}, 'black')
