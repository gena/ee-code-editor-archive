/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: 98ff00 */ee.Geometry.Polygon(
        [[[-112.5933837890625, 40.79717741518769],
          [-112.269287109375, 40.622291783092706],
          [-112.1209716796875, 40.75557964275591],
          [-112.2967529296875, 40.9964840143779],
          [-112.236328125, 41.05035951931887],
          [-111.95068359375, 40.82212357516945],
          [-111.97265625, 40.94256444133329],
          [-112.1978759765625, 41.17451935556443],
          [-112.0166015625, 41.32732632036622],
          [-112.08513789011192, 41.45504287517191],
          [-112.1923828125, 41.51680395810117],
          [-112.2857674347049, 41.52714798078315],
          [-112.36817139269732, 41.52097439196504],
          [-112.423095703125, 41.50857729743935],
          [-112.5604248046875, 41.40153558289846],
          [-112.796630859375, 41.759019938155404],
          [-112.8955078125, 41.70162734378918],
          [-113.038330078125, 41.50857729743935],
          [-112.87353515625, 41.23238023874142],
          [-112.6153564453125, 40.863679665481676]]]),
    geometry2 = /* color: 0B4A8B */ee.Geometry.Polygon(
        [[[-112.4560546875, 41.0130657870063],
          [-112.379150390625, 41.075210270566636],
          [-112.412109375, 41.17038447781618],
          [-112.5164794921875, 41.075210270566636],
          [-112.5604248046875, 41.18692242290296],
          [-112.4560546875, 41.24064190269477],
          [-112.3187255859375, 41.33145127732962],
          [-112.467041015625, 41.33145127732962],
          [-112.5933837890625, 41.21998578493921],
          [-112.774658203125, 41.45919537950706],
          [-112.730712890625, 41.28606238749825],
          [-112.4945068359375, 40.95915977213492]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Advection

Map.centerObject(geometry, 9)

var step = 160

var aoi = geometry.buffer(1*step, step).difference(geometry2)

var image = ee.Image(1).byte().paint(aoi, 0)

var crs = ee.Projection('EPSG:3857'); // Web Mercator
var crs_transform = [step,0,0,0,step,0]
var units = 'meters'
var distanceStep = step
var maxDistance = 20000
var d = image.distance(ee.Kernel.euclidean(maxDistance, "meters")).reproject(crs, crs_transform);

/*
var crs = image.getInfo().bands[0].crs
var crs_transform = crs.crs_transform
var units = 'pixels'
var distanceStep = 1
var maxDistance = 120
var d = image.distance(ee.Kernel.euclidean(maxDistance, "pixels"));
*/
d = d.clip(aoi);

Map.addLayer(d, {min:0, max:maxDistance}, 'distance')


d = d//.reproject(crs, crs_transform)


function radians(img) { return img.toFloat().multiply(Math.PI).divide(180); }

// var slope = radians(terrain.select(['slope'])); // BUG
var radius = step*3;
var sigma = step*0.5;
var gaussianKernel = ee.Kernel.gaussian(radius, sigma, units);
//d = d.convolve(gaussianKernel);

var terrain = ee.Algorithms.Terrain(d);

var k_dx = ee.Kernel.fixed(3, 3,
                       [[ 1/8,  0,  -1/8],
                        [ 2/8,  0,  -2/8],
                        [ 1/8,  0,  -1/8]]);

var k_dy = ee.Kernel.fixed(3, 3,
                       [[ -1/8, -2/8,  -1/8],
                        [ 0,    0,    0],
                        [ 1/8, 2/8,   1/8]]);


var dx = d.convolve(k_dx)
var dy = d.convolve(k_dy)
var slope = ee.Image().expression("sqrt((x*x + y*y)/(step*step))", {x: dx, y: dy, step: distanceStep}).atan()
  .reproject(crs, crs_transform).clip(aoi);

//var slope = radians(ee.Terrain.slope(d));

/*
var minPixels = 100
var small = slope.mask().toInt().connectedPixelCount(minPixels, true);
Map.addLayer(small, {min:0, max:min_Pixels})
*/

Map.addLayer(slope.mask(slope.lt(Math.PI*0.243)), {palette:['ff0000','000000']}, 'slope', false)

var aspect = dx.atan2(dy).add(Math.PI)
  .reproject(crs, crs_transform).clip(aoi);

var colorsRainbow = [
'F26C4F', // Light Red
'F68E55', // Light Red Orange	
'FBAF5C', // Light Yellow Orange
'FFF467', // Light Yellow
'ACD372', // Light Pea Green
'7CC576', // Light Yellow Green
'3BB878', // Light Green
'1ABBB4', // Light Green Cyan
'00BFF3', // Light Cyan
'438CCA', // Light Cyan Blue
'5574B9', // Light Blue
'605CA8', // Light Blue Violet
'855FA8', // Light Violet
'A763A8', // Light Violet Magenta
'F06EA9', // Light Magenta
'F26D7D'  // Light Magenta Red
];
Map.addLayer(aspect, {min:0, max:2*Math.PI, palette:colorsRainbow}, 'aspect', true)

var cannys = ee.Algorithms.CannyEdgeDetector(slope, 0.1, 0).reproject(crs, crs_transform);
Map.addLayer(cannys.mask(cannys.gt(0)), {min: 0, max: 1, palette: 'FF0000'}, 'canny(slope)');

var cannya = ee.Algorithms.CannyEdgeDetector(aspect, 0.1, 0).reproject(crs, crs_transform);
Map.addLayer(cannya.mask(cannya), {min: 0, max: 1, palette: '000000'}, 'canny(aspect)');


Map.addLayer(cannya.mask(cannya.and(cannys.focal_max(3).focal_min(3).gt(0))), {min: 0, max: 1, palette: '0000FF'}, 'skeleton');

/*
// slope of aspect

var dx = aspect.convolve(k_dx)
var dy = aspect.convolve(k_dy)
var aspect_slope = ee.Image().expression("sqrt((x*x + y*y)/(step*step))", {x: dx, y: dy, step: distanceStep}).atan()
var aspect_slope_mask = aspect.gt(1.9*Math.PI).or(aspect.lt(0.1*Math.PI)).not()
Map.addLayer(aspect_slope.mask(aspect_slope_mask), {palette:['ff0000','000000']}, 'aspect slope', true)
*/

// propagate quantity from boundary along the distance transform surface
/*
// upwind
var dE = ee.Kernel.fixed(3, 3,
                       [[ 0,  0,  0],
                        [ 0, 1,  -1],
                        [ 0,  0,  0]]);

var dW = ee.Kernel.fixed(3, 3,
                       [[ 0,  0,  0],
                        [ -1,  1, 0],
                        [ 0,  0,  0]]);

var dS = ee.Kernel.fixed(3, 3,
                       [[ 0,  0,  0],
                        [ 0,  1,  0],
                        [ 0,  -1,  0]]);

var dN = ee.Kernel.fixed(3, 3,
                       [[ 0,  -1,  0],
                        [ 0,  1,  0],
                        [ 0,  0,  0]]);

var W = ee.Kernel.fixed(3, 3,
                       [[ 0,  0,  0],
                        [ 1, 0,  0],
                        [ 0,  0,  0]]);

var E = ee.Kernel.fixed(3, 3,
                       [[ 0,  0,  0],
                        [ 0,  0,  1],
                        [ 0,  0,  0]]);

var N = ee.Kernel.fixed(3, 3,
                       [[ 0,  1,  0],
                        [ 0,  0,  0],
                        [ 0,  0,  0]]);

var S = ee.Kernel.fixed(3, 3,
                       [[ 0,  0,  0],
                        [ 0,  0,  0],
                        [ 0,  1,  0]]);


var c_0 = ee.Image(1.0).toFloat().clip(aoi).reproject(crs, crs_transform)
Map.addLayer(c_0, {min: 0, max: 100}, 'C(0)', false)

// print(Chart.image.histogram(aspect, aoi, step).setOptions({title: 'aspect'}));

var lddW = aspect.gte(3/4*Math.PI).and(aspect.lt(5/4*Math.PI)).reproject(crs, crs_transform)
var lddE = aspect.gte(7/4*Math.PI).or(aspect.lt(1/4*Math.PI)).reproject(crs, crs_transform)
var lddN = aspect.gte(5/4*Math.PI).and(aspect.lt(7/4*Math.PI)).reproject(crs, crs_transform)
var lddS = aspect.gte(1/4*Math.PI).and(aspect.lt(3/4*Math.PI)).reproject(crs, crs_transform)

Map.addLayer(lddW.mask(lddW), {palette:'aaaaaa'}, 'lddW', false)
Map.addLayer(lddE.mask(lddE), {palette:'0000aa'}, 'lddE', false)
Map.addLayer(lddN.mask(lddN), {palette:'aa0000'}, 'lddN', false)
Map.addLayer(lddS.mask(lddS), {palette:'00aa00'}, 'lddS', false)

// advect 1 time step
var velocity = slope.multiply(step).toFloat().clip(aoi).reproject(crs, crs_transform); 
var dx = ee.Image(step).toFloat().reproject(crs, crs_transform);
var dt = ee.Image(1.0).toFloat().reproject(crs, crs_transform);
var c_prev = c_0;

Map.addLayer(velocity, {}, 'velocity', false)
Map.addLayer(dt.multiply(velocity).divide(dx), {}, 'courant', false)

var c_next = null;
for(var n=0; n<2; n++) {
  var fluxW = lddW.convolve(E).reproject(crs, crs_transform).multiply(c_prev.convolve(dW).reproject(crs, crs_transform)).add(slope.convolve(E).reproject(crs, crs_transform)).multiply(lddW).reproject(crs, crs_transform);
  var fluxE = lddE.convolve(W).reproject(crs, crs_transform).multiply(c_prev.convolve(dE).reproject(crs, crs_transform)).add(slope.convolve(W).reproject(crs, crs_transform)).multiply(lddE).reproject(crs, crs_transform);
  var fluxN = lddN.convolve(S).reproject(crs, crs_transform).multiply(c_prev.convolve(dN).reproject(crs, crs_transform)).add(slope.convolve(S).reproject(crs, crs_transform)).multiply(lddN).reproject(crs, crs_transform);
  var fluxS = lddS.convolve(N).reproject(crs, crs_transform).multiply(c_prev.convolve(dS).reproject(crs, crs_transform)).add(slope.convolve(N).reproject(crs, crs_transform)).multiply(lddS).reproject(crs, crs_transform);

  var c_next = c_prev.subtract(dt.multiply(fluxW.add(fluxE).add(fluxN).add(fluxS).reproject(crs, crs_transform)).divide(dx)).reproject(crs, crs_transform)
  c_prev = c_next;
}

var mapBounds = Map.getBounds(true)
var min = c_next.reduceRegion(ee.Reducer.min(), mapBounds).get('constant')
var max = c_next.reduceRegion(ee.Reducer.max(), mapBounds).get('constant')

Map.addLayer(fluxS.add(fluxN).add(fluxE).add(fluxW), {min:0, max:2, palette:['ffffff', '000000']}, 'fluxS(' + (n + 1) + ')', true)  
Map.addLayer(c_next, {min:0, max:2, palette:['ffffff', '000000']}, 'C(' + (n + 1) + ')', true)  
*/

/*print('min', min)
print('max', max)
Map.addLayer(c_next, {min:min, max:max, palette:['ffffff', '000000']}, 'C(' + (n + 1) + ')', true)  
*/



