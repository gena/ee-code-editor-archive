/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var g = /* color: d63000 */ee.Geometry.Polygon(
        [[[-105.1171875, 40.38002840251183],
          [-109.072265625, 45.27488643704894],
          [-113.90625, 43.70759350405294],
          [-111.09375, 40.979898069620155]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var step = 50000
var distance = 500000
var crs = ee.Projection('EPSG:3857'); // Web Mercator
var crs_transform = [step,0,0,0,step,0]

var image = ee.Image(1).byte().paint(g, 0)

var d = image.distance(ee.Kernel.euclidean(500000, "meters")).reproject(crs, crs_transform).clip(g);

Map.centerObject(g, 6)
Map.addLayer(d, {min:0, max:distance})

var s = d.convolve(ee.Kernel.sobel()).reproject(crs, crs_transform).clip(g)
Map.addLayer(s, {}, 'sobel')
