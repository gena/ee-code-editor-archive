// Load a Landsat 7 image.
var imageAfter = ee.Image('LANDSAT/LE7_L1T_TOA/LE71970492013338ASN00');

// Compute the EVI using an expression.
var eviAfter = imageAfter.expression(
    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
      'NIR': imageAfter.select('B4'),
      'RED': imageAfter.select('B3'),
      'BLUE': imageAfter.select('B1')
});

//Load second Landsat 7 image.
var imageBefore = ee.Image('LANDSAT/LE7_L1T_TOA/LE71970492003343MPS00');

// Compute the EVI using an expression.
var eviBefore = imageBefore.expression(
    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
      'NIR': imageBefore.select('B4'),
      'RED': imageBefore.select('B3'),
      'BLUE': imageBefore.select('B1')
});

var palette = ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
              '74A901', '66A000', '529400', '3E8601', '207401', '056201',
              '004C00', '023B01', '012E01', '011D01', '011301'];

var difference  = eviBefore.subtract(eviAfter);
var imageDif = ee.Image(0)
var imageDif = ee.Image(0).where(difference.lte(-0.2),1)
imageDif = imageDif.mask(difference.lte(-0.2))

Map.centerObject(imageAfter, 9);
Map.addLayer(eviBefore, {min: 0, max: 1, palette:palette}, 'before');
Map.addLayer(eviAfter, {min: 0, max: 1, palette:palette}, 'after');
Map.addLayer(imageDif,{palette:'FF0000'}, 'dif');

// Export the image, specifying scale and region.
var region = imageAfter.geometry().intersection(imageBefore.geometry()).bounds().getInfo()
var info = imageAfter.getInfo().bands[0];
var crs = info.crs;
var crs_transform = info.crs_transform;

Export.image(imageDif.unmask(-9999, false), 'imageDif', {
  'crs': crs,
  'crs_transform': JSON.stringify(crs_transform),
  'region': region.coordinates,
  'driveFileNamePrefix': 'imageDiff'
});
