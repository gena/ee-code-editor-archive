print(hand.size())

function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

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

function renderDem(dem) {
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

  var v = dem.sldStyle(style_dem);

  return hillshadeit(v, dem, 1.2, 3.0, azimuth, zenith);
}

var colors_hand = ['023858', '006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027'];
var azimuth = 90;
var zenith = 15;


var vfpImages = [
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM1').rename('elevation').unmask(),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM2').rename('elevation').unmask(),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM3').rename('elevation').unmask(),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM4').rename('elevation').unmask(),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM5').rename('elevation').unmask(),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM6').rename('elevation').unmask(),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM7').rename('elevation').unmask(),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM8').rename('elevation').unmask(),
];

var vfp = ee.ImageCollection(vfpImages).mosaic().add(0)
Map.addLayer(vfp, {min:0, max:2000}, 'VFP', false)

Map.addLayer(srtm.gt(-100), {}, 'SRTM mask', false)

Map.addLayer(srtm, {min:0, max:2000}, 'SRTM (raw)', false)

hand = hand.mosaic().focal_mean(0.5)

// make a mosaic dem
for(var i = 0; i < 8; i++) {
  var dem = vfpImages[i];
  var hand_vis = hillshadeit(hand.visualize({min:-1, max:30, palette:colors_hand}), dem, 
    1.2, 3, azimuth, zenith);
  Map.addLayer(hand_vis, {}, 'HAND (VFP' + i + ')', false)
}

Map.addLayer(hand.visualize({min:-1, max:30, palette:colors_hand}), 
  {}, 'HAND (VFP)', true)

var dem = srtm

var hand_vis = hillshadeit(hand.visualize({min:-1, max:30, palette:colors_hand}), dem, 
  1.2, 3, azimuth, zenith);
Map.addLayer(hand_vis, {}, 'HAND', true)
Map.addLayer(hand, {min: 0, max: 100}, 'HAND (raw)', false)

Map.addLayer(srtm, {min:0, max:2000}, 'SRTM (raw)', false)
Map.addLayer(renderDem(srtm), {}, 'SRTM', false)

var water = hand.lte(1)
Map.addLayer(water.mask(water), {palette:['0010ff'], opacity:0.8}, 'water (HAND < 1m)', true);

var water = hand.lte(2)
Map.addLayer(water.mask(water), {palette:['0010ff'], opacity:0.8}, 'water (HAND < 2m)', false);

var water = hand.lte(5)
Map.addLayer(water.mask(water), {palette:['0010ff'], opacity:0.8}, 'water (HAND < 5m)', false);

var water = hand.lte(10)
Map.addLayer(water.mask(water), {palette:['0010ff'], opacity:0.8}, 'water (HAND < 10m)', false);

var water = hand.lte(2)
Map.addLayer(water.mask(water), {palette:['00aaff'], opacity:0.8}, 'water (HAND < 2m), light', false);

