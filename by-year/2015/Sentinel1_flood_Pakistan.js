
var p = function(image){return image.log10().multiply(10)}
function radians(img) {
  return img.toFloat().multiply(Math.PI).divide(180);
}

var lc = ee.Image('ESA/GLOBCOVER_L4_200901_200912_V2_3').select(0);
var terrain = ee.Algorithms.Terrain(ee.Image('srtm90_v4'));
var slope = radians(terrain.select('slope'));

var pol = 'VV'
var normal = ee.ImageCollection('COPERNICUS/S1').filter(
  ee.Filter.eq('transmitterReceiverPolarisation', pol)).select(pol).filterDate(
    '2015-06-01', '2015-07-01').map(p).mean();
var flood = ee.ImageCollection('COPERNICUS/S1').filter(
  ee.Filter.eq('transmitterReceiverPolarisation', pol)).select(pol).filterDate(
    '2015-07-10', '2015-08-31').map(p).mean();
var diff = flood.subtract(normal);

Map.addLayer(normal, {min:-30, max:-5}, 'Normal ' + pol, false);
Map.addLayer(flood, {min:-30, max:-5}, 'Flood ' + pol, false);

Map.addLayer(diff, {min:-5, max:5},  'Diff ' +pol, false)

var thresh = -16;
var diff_thresh = -4;
Map.addLayer(diff.mask(
  flood.lt(thresh).and(normal.gt(thresh))
  .and(diff.lt(diff_thresh))
  .and(slope.lt(0.1)).and(lc.neq(210))),
  {palette:['0000ff']},  'Diff threshold')

Map.setCenter(70, 30, 6)