var image = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980242014068LGN00');

var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'pan'];
var L8_NAMES =  ['B2',   'B3',    'B4',  'B5',  'B6',    'B8'];
image = image.select(L8_NAMES, STD_NAMES);

var rgb = image.select(['red', 'green', 'blue']);

var vis = {min:0.05, max:0.25, gamma: 1.3};

Map.addLayer(rgb, vis, 'RGB');

// pan-sharpen image using 15m band
var gray = image.select('pan');
var huesat = rgb.rgbToHsv().select('hue', 'saturation');
var upres = ee.Image.cat(huesat, gray).hsvToRgb();

Map.addLayer(upres, vis, 'RGB (pansharpened)');
