/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(Map.getCenter())
Map.setCenter(105.29, 15.04, 10)

var azimuth = 90;
var zenith = 30;

var slope_threshold = 0.4
var mndwi_threshold = 0.3


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

var pansharpen = function(image) {
    var pan = image.select('pan');
    var rgb = image.select('red', 'green', 'blue');
    var hsv  = rgb.rgbtohsv();
    var huesat = hsv.select('hue', 'saturation');
    var upres = ee.Image.cat(huesat, pan).hsvtorgb();
 
    return upres;
}

var water_index_style = '\
<RasterSymbolizer>\
  <ColorMap extended="true" >\
    <ColorMapEntry color="#ffffd9" quantity="-1.0" label="-1"/>\
    <ColorMapEntry color="#edf8b1" quantity="-0.8" label="-1"/>\
    <ColorMapEntry color="#c7e9b4" quantity="-0.6" label="-1"/>\
    <ColorMapEntry color="#7fcdbb" quantity="-0.4" label="-1"/>\
    <ColorMapEntry color="#41b6c4" quantity="-0.2" label="-1"/>\
    <ColorMapEntry color="#1d91c0" quantity="0.0" label="-1"/>\
    <ColorMapEntry color="#225ea8" quantity="0.2" label="-1"/>\
    <ColorMapEntry color="#253494" quantity="0.4" label="-1"/>\
    <ColorMapEntry color="#081d58" quantity="0.6" label="-1"/>\
    <ColorMapEntry color="#081dff" quantity="1.0" label="-1"/>\
  </ColorMap>\
</RasterSymbolizer>';

var LC8_BANDS = ['B1',    'B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10', 'BQA'];
var STD_NAMES = ['blue2', 'blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp', 'BQA'];

var bounds = ee.Geometry(Map.getBounds(true));
var visProps = {min:0.06, max:0.5, gamma:1.5}

var images = l8.filterBounds(bounds).select(LC8_BANDS, STD_NAMES)

var dem = ee.Image('USGS/SRTMGL1_003');
var terrain = ee.call('Terrain', dem);

function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }
var slope = radians(terrain.select(['slope']));

var slopeMask = slope.gt(slope_threshold).focal_max(2).focal_min(2)
slopeMask = slopeMask.mask(slopeMask)

function getSimpleEdge(i) {
  var canny = ee.Algorithms.CannyEdgeDetector(i, 0.99, 0);
  canny = canny.mask(canny)
  return canny;
}

function addPercentileLayers(percentile, water_color, water_edge_color, visible) {
  var image = images.reduce(ee.Reducer.percentile([percentile])).rename(STD_NAMES)
  Map.addLayer(image.select(['swir1', 'nir', 'green']), visProps, 'swir1_nir_green ' + percentile + '%', visible)
  
  var mndwi = image.normalizedDifference(['green', 'swir1'])
  Map.addLayer(mndwi.sldStyle(water_index_style), {}, 'mndwi ' + percentile + '%', false)
  
  var water = mndwi.gt(mndwi_threshold)
      //.mask(slopeMask)
  Map.addLayer(water.mask(water), {palette:[water_color]}, 'water ' + percentile + '%', visible)
  
  Map.addLayer(getSimpleEdge(water), {min: 0, max: 1, palette: [water_edge_color]}, 'water (edge) ' + percentile + '%', visible);
}

Map.addLayer(hillshadeit(dem.sldStyle(style_dem), dem, 1.2, 3.0), {}, 'dem');

addPercentileLayers(8, '0000ff', 'ffffff', true)
addPercentileLayers(40, '0000aa', 'aaaaaa', false)

Map.addLayer(slopeMask, {opacity:0.7, palette:['000000']}, 'slope mask', false)

