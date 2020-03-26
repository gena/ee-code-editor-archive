
//dd
// homogenized catchments used to generate HAND (max 4 degrees in size)
var basinsHomogenized = ee.FeatureCollection('ft:18sfnW2pa7CmmM00d-atNL4qodcCcWdZlzzrR4qdm')

// HydroBASINS, level 3
var basinsLevel3 = ee.FeatureCollection('ft:13dShZ5yGqCEqk3dsJvYEL3lsa1hEmpMRldxK7aSa') // Asia, level 3
  .filter(ee.Filter.or(
        ee.Filter.eq('PFAF_ID', 442), // Mekong
        ee.Filter.eq('PFAF_ID', 441), // Ho Chi Minh
        ee.Filter.eq('PFAF_ID', 443) // Thailand
        ));

//var aoi = basinsLevel3.union().geometry().simplify(1000);
var aoi = basinsHomogenized

var dem = ee.Image('USGS/SRTMGL1_003');

function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

// DEM Hillshade function - Compute hillshade for the given illumination az, el.
function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, weight, height_multiplier, azimuth, zenith) {
  var hsv  = image.unitScale(0, 255).rgbtohsv();

  var terrain = ee.call('Terrain', elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));

  var aspect = radians(terrain.select(['aspect'])).resample('bicubic');
  var hs = hillshade(azimuth, zenith, slope, aspect).resample('bicubic');

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');

  return ee.Image.cat(huesat, intensity).hsvtorgb();
}

function renderDem() {
  var style_dem = '\
  <RasterSymbolizer>\
    <ColorMap  type="intervals" extended="false" >\
      <ColorMapEntry color="#cef2ff" quantity="-200" label="-200m"/>\
      <ColorMapEntry color="#9cd1a4" quantity="0" label="0m"/>\
      <ColorMapEntry color="#7fc089" quantity="50" label="50m" />\
      <ColorMapEntry color="#9cc78d" quantity="100" label="100m" />\
      <ColorMapEntry color="#b8cd95" quantity="250" label="250m" />\
      <ColorMapEntry color="#d0d8aa" quantity="500" label="500m" />\
      <ColorMapEntry color="#e1e5b4" quantity="750" label="750m" />\
      <ColorMapEntry color="#f1ecbf" quantity="1000" label="1000m" />\
      <ColorMapEntry color="#e2d7a2" quantity="1250" label="1250m" />\
      <ColorMapEntry color="#d1ba80" quantity="1500" label="1500m" />\
      <ColorMapEntry color="#d1ba80" quantity="10000" label="10000m" />\
    </ColorMap>\
  </RasterSymbolizer>';

  var azimuth = 90;
  var zenith = 15;

  var gaussianKernel = ee.Kernel.gaussian(2, 1, 'pixels', true, 2);
  //dem = dem.convolve(gaussianKernel);

  var v = dem.clip(aoi).sldStyle(style_dem);

  return hillshadeit(v, dem, 1.1, 2.0, azimuth, zenith);
}

var aoiImage = ee.Image(0).toByte().paint(aoi, 1)
Map.addLayer(aoiImage.mask(aoiImage), {palette:['000000'], opacity:0.6}, 'aoi')
  
// HAND
var hand = ee.Image('users/gena/ServirMekong/SRTM_30_Asia_Mekong_hand')

var colors_hand = ['023858', '006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027'];
var azimuth = 90;
var zenith = 30;
//dem = dem.convolve(ee.Kernel.gaussian(2, 1, 'pixels', true, 2));
//hand = hand.convolve(ee.Kernel.gaussian(1, 1, 'pixels', true, 1));
var hand_vis = hillshadeit(hand.visualize({min:-1, max:30, palette:colors_hand}), dem, 1.1, 2, azimuth, zenith);
Map.addLayer(hand_vis.clip(aoi), {}, 'HAND')
Map.addLayer(hand, {}, 'HAND (raw)', false)

Map.addLayer(renderDem(), {}, 'DEM', false)
Map.addLayer(dem, {}, 'DEM (raw)', false)

var hand_water = hand.lt(1);
Map.addLayer(hand_water.mask(hand_water).clip(aoi), {palette:['0000ff']}, 'HAND < 1m')

var hand_water = hand.lt(2);
Map.addLayer(hand_water.mask(hand_water).clip(aoi), {palette:['0000ff']}, 'HAND < 2m', false)

var hand_water = hand.lt(3);
Map.addLayer(hand_water.mask(hand_water).clip(aoi), {palette:['0000ff']}, 'HAND < 3m', false)

var hand_water = hand.lt(5);
Map.addLayer(hand_water.mask(hand_water).clip(aoi).focal_max(1), {palette:['0000ff']}, 'HAND < 5m', false)

var basinsHomogenizedImage = ee.Image(0).toByte().paint(basinsHomogenized, 1, 1)
Map.addLayer(basinsHomogenizedImage.mask(basinsHomogenizedImage), {palette:['000000']}, 'catchments, homogenized')

var basinsMekongImage = ee.Image(0).toByte().paint(basinsLevel3, 1, 2)
Map.addLayer(basinsMekongImage.mask(basinsMekongImage), {palette:['000000']}, 'catchments, Mekong (and around)')

Map.centerObject(basinsHomogenized, 6)

var grid = ee.FeatureCollection('ft:1w1xSxV-tXEQ10pC-V3QRyeM7jZHa9_7TeeOa_zkt')
var gridImage = ee.Image().toByte().paint(grid, 1, 1)
Map.addLayer(gridImage.mask(gridImage), {palette:['50ff50']}, 'grid', false)

Map.setOptions('SATELLITE')