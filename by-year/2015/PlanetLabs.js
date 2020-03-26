/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    planetLabs = ee.Image("users/gena/20141214_010922_0907_analytic");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var pansharpen = function(image) {
    var pan = image.select('pan');
    var rgb = image.select('red', 'green', 'blue');
    var hsv  = rgb.rgbtohsv();
    var huesat = hsv.select('hue', 'saturation');
    var upres = ee.Image.cat(huesat, pan.multiply(2)).hsvtorgb();
 
    return upres;
}

var bounds = ee.Geometry(Map.getBounds(true))

l8 = l8
  .filterBounds(bounds.centroid(1))
  .select(['B4', 'B3', 'B2', 'B8', 'B6', 'B5'], ['red', 'green', 'blue', 'pan', 'swir1', 'nir'])
  .filterMetadata('CLOUD_COVER', 'less_than', 5)

var image = ee.Image(l8.first())

Map.addLayer(pansharpen(image), {min:0.02, max:0.4}, 'Landsat 8, RGB')

Map.addLayer(image.select('swir1', 'nir', 'green'), {min:0.02, max:0.4}, 'Landsat 8, false-color (SWIR, NIR, GREEN)')

planetLabs = planetLabs.mask(planetLabs.neq(0))
Map.addLayer(planetLabs, {min:200, max:[600, 600, 800]}, 'Planet Labs')