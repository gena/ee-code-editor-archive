/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var fa = ee.Image("WWF/HydroSHEDS/15ACC"),
    fa90 = ee.Image("users/gena/GlobalHAND/90m-global/fa");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var hydroBasinsL00 = ee.Image('users/rutgerhofste/PCRGlobWB20V04/support/global_Standard_lev00_30sGDALv01')
var hand30 = ee.ImageCollection('users/gena/global-hand/hand-100').mosaic()

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

var hand = null;
var dem = null;
var srtm = null
var swbdMask = null;

function initializeGlobals() {
  hand = ee.ImageCollection('users/gena/global-hand/hand-100');
  srtm = ee.Image('USGS/SRTMGL1_003');

  var demImages = [
    ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM1'),
    ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM2'),
    ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM3'),
    ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM4'),
    ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM5'),
    ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM6'),
    ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM7'),
    ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM8'),
    srtm
  ];

  // smoothen HAND a bit, scale varies a little in the tiles
  hand = hand.mosaic().focal_mean(0.5)

  // fix cache
  dem = ee.ImageCollection(demImages).map(function(i) { return i.rename('elevation').add(0).focal_mean(0.5); })

  // exclude SWBD water
  var swbd = ee.Image('MODIS/MOD44W/MOD44W_005_2000_02_24').select('water_mask')
  swbdMask = swbd.unmask().not()
    .focal_mode(100, 'circle', 'meters', 3)
    .focal_max(100, 'circle', 'meters')

  var handMask = hand.mask()

  dem = dem.map(function(i) { return i.updateMask(handMask) })
}

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
var zenith = 10;
var hsWeight = 1.1;
var heightMultiplier = 3;

var colors_hand = ['023858', '006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027'];



function renderDEM() {
  return dem.map(function(i) { 
    var demRGB = i.sldStyle(style_dem);
    return hillshadeit(demRGB, i, hsWeight, heightMultiplier, azimuth, zenith); 
  }).mosaic()
}


function renderFA(smooth) {
  // return fa.mask(fa.gt(100)).visualize({palette:['111100', 'ffff00'], min:100, max:1000})
  
  var paletteFA = ['deebf7','9ecae1','3182bd']

  var faTh = 100
  var mask = fa90.gt(faTh)
  
  if(smooth) {
    mask = mask
      .focal_max(90, 'circle', 'meters')
      .focal_mode(90, 'circle', 'meters', 3)
      .focal_min(90, 'circle', 'meters')
  
    return fa90
      .focal_max(90, 'circle', 'meters')
      .mask(mask).visualize({palette: paletteFA, min:faTh, max:5000})
  } else {
    return fa90.mask(mask).visualize({palette: paletteFA, min:faTh, max:5000})
  }
  
}

function renderHAND() {
  return dem.map(function(i) { 
    var handRGB = hand.visualize({min:-1, max:50, palette:colors_hand});
    return hillshadeit(handRGB, i, hsWeight, heightMultiplier, azimuth, zenith); 
  }).mosaic()
}

initializeGlobals()
Map.addLayer(renderDEM(), {}, 'dem')
Map.addLayer(renderHAND(), {}, 'hand', false)

Map.addLayer(hydroBasinsL00.randomVisualizer(), {opacity: 0.5}, 'HydroBASINS', true)
Map.addLayer(hydroBasinsL00.focal_mode(500, 'circle', 'meters', 5).randomVisualizer(), {opacity: 0.5}, 'HydroBASINS (smooth)', false)

Map.addLayer(renderFA(), {}, 'flow accumulation', true)
Map.addLayer(renderFA(true), {}, 'flow accumulation (smooth)', false)
