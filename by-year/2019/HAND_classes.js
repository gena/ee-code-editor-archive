/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var hand = ee.Image("users/gena/GlobalHAND/30m/hand-1000");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function renderHandClasses() {
  var dem = ee.Image('USGS/SRTMGL1_003')

  //var terrain = ee.call('Terrain', dem);

  var gaussianKernel = ee.Kernel.gaussian(3, 2, 'pixels', true, 2);
  var terrain = ee.call('Terrain', dem.convolve(gaussianKernel));
  
  var slope = radians(terrain.select(['slope']))
    .lt(0.076)
    
  //Map.addLayer(slope.mask(slope), {palette:'000000'}, 'slope < 0.076', false)

  //Map.addLayer(slope.mask(slope), {palette:'000000'}, 'slope < 0.076 (smoothed)', false)

  var hand_class = hand.addBands(slope).expression(
    "(b(0) <= 5.3) ? 0 \
      : (b(0) <= 15 && b(0) > 5.3 ) ? 1 \
      : (b(0) > 15 && b(1) == 0 ) ? 2 \
      : (b(0) > 15 && b(1) == 1 ) ? 3 \
      : 0"
  );
  
  var style_hand_classes = '\
  <RasterSymbolizer>\
    <ColorMap  type="intervals" extended="false" >\
      <ColorMapEntry color="#000055" quantity="0" label="Waterlogged"/>\
      <ColorMapEntry color="#00ff00" quantity="1" label="Ecotone"/>\
      <ColorMapEntry color="#ffff00" quantity="2" label="Slope" />\
      <ColorMapEntry color="#ff0000" quantity="3" label="Plateau" />\
    </ColorMap>\
  </RasterSymbolizer>';
  
  var azimuth = 90;
  var zenith = 30;

  //var hand_class_vis = hand_class.visualize({palette: colors_hand_classes})
  var hand_class_vis = hand_class
    .focal_min({radius:30, units:'meters', iterations:1})
    .focal_mode({radius:60, units:'meters', iterations:3})
    .sldStyle(style_hand_classes)

  return hillshadeit(hand_class_vis, dem, 1.1, 5, azimuth, zenith)
}

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

Map.addLayer(renderHandClasses())
