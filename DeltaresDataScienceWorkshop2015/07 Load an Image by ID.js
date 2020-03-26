var image = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980242014068LGN00');

var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1'];
var L8_NAMES =  ['B2',   'B3',    'B4',  'B5',  'B6'];
image = image.select(L8_NAMES, STD_NAMES);

var rgb = image.select(['red', 'green', 'blue']);

var vis = {min:0, max:0.3};

Map.addLayer(rgb, vis, 'RGB');

Map.centerObject(rgb)