/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: 98ff00 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var images = ee.ImageCollection('SKYSAT/GEN-A/PUBLIC/ORTHO/MULTISPECTRAL')

var rescale = function (img, thresholds) {
    return img.subtract(thresholds[0]).divide(ee.Number(thresholds[1]).subtract(thresholds[0]))
};

var pansharpen = function(image, pan) {
    var hsv  = image.select(0,1,2).rgbtohsv();
    var huesat = hsv.select('hue', 'saturation');
    var upres = ee.Image.cat(huesat, pan).hsvtorgb();
 
    return upres;
}

Export.video(
  images.filterBounds(Map.getBounds(true)).map(function(i) {
    return i.select(['R', 'G', 'B']).visualize({min:350, max:[2500,2500,4000]})
  }),
  'Reservoir, Spain')

// add mosaics
var vis = {min:1000, max:10000}
Map.addLayer(images.select('P'), vis, 'pan', false)

var vis = {min:1000, max:5000}
Map.addLayer(images.select(['N','R','G']), vis, 'false', false)

var vis = {min:1000, max:[5500,5500,7000]}
var rgb = images.select(['R','G','B']).mosaic();
var rgb = rgb.subtract(rgb.convolve(ee.Kernel.gaussian(5, 4, 'meters')).convolve(ee.Kernel.laplacian8(0.4)))

Map.addLayer(rgb, vis, 'rgb', false)

var vis = {min:800, max:[5000,5000,7000]}
var rgb = rescale(images.mosaic().select(['R','G','B']), [800, 5000]);
var pan = rescale(images.mosaic().select(['N']), [800, 5000])
var pansharpened = pansharpen(rgb, pan);
var sharpened = pansharpened.subtract(pansharpened.convolve(ee.Kernel.gaussian(5, 4, 'meters')).convolve(ee.Kernel.laplacian8(0.4)))

Map.addLayer(pansharpened, {min:0, max:1}, 'rgb (pan)', false)
Map.addLayer(sharpened, {min:0, max:1}, 'rgb (pan, LoG)', false)

var vis = {palette:['ffff00']}
Map.addLayer(images.select(0).map(function(i) { return i.mask().mask(i.mask())}), vis, 'envelope', false)

// add centers
var locations = ee.FeatureCollection(images.map(function(i){return ee.Feature(i.geometry(), {'v': 1}).centroid()}))
Map.addLayer(locations, {color:'ffff00'}, 'centers')

var maxCount = 50
// add max first maxCount images for the first points in the current map
var currentLocations = locations.filterBounds(Map.getBounds(true)).limit(maxCount)
var count = currentLocations.size().getInfo()
if(count < maxCount) { // add layer
  print('Adding layers for ' + count + ' images')
 
  var list = images.filterBounds(Map.getBounds(true)).toList(count)
  ee.List.sequence(0, count-1).getInfo().map(function(i) {
    var vis = {min:350, max:[2500,2500,4000]}
    var img = ee.Image(list.get(i));
    var id = img.get('catalogID').getInfo()
    Map.addLayer(img.select(['R','G','B']), vis, id, false)
    
    Map.addLayer(img.select(['P']), {min: 300, max: 10000}, id + ' (pan)', false)

    var vis = {min:-0.3, max:0.4, palette:['00ff00', 'ffffff','0000ff']}
    Map.addLayer(img.normalizedDifference(['G', 'N']), vis, id + ' ndwi', false)
  })
} else {
  print('Number of images is > ' + maxCount + ', zoom in to add current map images as layers')
}

Map.setOptions('SATELLITE')

// render heatmap
var heatmapColors = ['000000', '00ff00', 'ffff00', 'ff0000']

var heatmap = locations
  .reduceToImage(['v'], ee.Reducer.sum())
  .focal_max(10, 'circle')
  .convolve(ee.Kernel.gaussian(20, 15));

Map.addLayer(heatmap, {min:0, max:10, opacity: 0.7, palette: heatmapColors}, 'heatmap', true);
