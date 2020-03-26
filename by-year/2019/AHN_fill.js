var utils = require('users/gena/packages:utils')

var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']

var addDem = function(dem, name, min, max, visible) {
  var im = dem.visualize({palette:colors_dem, min:min, max:max, opacity: 1.0});
  Map.addLayer(utils.hillshadeRGB(im, dem, 1.4, 6.0, 35), {}, name, visible);
}

var dem = ee.Image('AHN/AHN2_05M_INT') // interpolated

var min = -5
var max = 10

// original
addDem(dem, 'AHN (land)', min, max, true)

// filled
var radius = 15
var iterations = 2
var demFilled = utils.fillGaps(dem, radius, iterations)
addDem(demFilled, 'AHN fill', min, max, true)


