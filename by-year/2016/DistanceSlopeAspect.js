/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #0b4a8b */ee.Geometry.Polygon(
        [[[-112.5933837890625, 40.79717741518769],
          [-112.269287109375, 40.622291783092706],
          [-112.1209716796875, 40.75557964275591],
          [-112.2967529296875, 40.9964840143779],
          [-112.236328125, 41.05035951931887],
          [-111.95068359375, 40.82212357516945],
          [-111.97265625, 40.94256444133329],
          [-112.1978759765625, 41.17451935556443],
          [-112.0166015625, 41.32732632036622],
          [-112.1923828125, 41.51680395810117],
          [-112.423095703125, 41.50857729743935],
          [-112.5604248046875, 41.40153558289846],
          [-112.796630859375, 41.759019938155404],
          [-112.8955078125, 41.70162734378918],
          [-113.038330078125, 41.50857729743935],
          [-112.87353515625, 41.23238023874142],
          [-112.6153564453125, 40.863679665481676]]]),
    geometry2 = /* color: #ffc82d */ee.Geometry.Polygon(
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
Map.centerObject(geometry, 9)

var image = ee.Image(1).byte().paint(geometry, 0).paint(geometry2, 1)
var maxDistance = 120

var d = image.distance(ee.Kernel.euclidean(maxDistance, "pixels"));
//var d = image.fastDistanceTransform(maxDistance, "pixels");

// d = d.updateMask(d.gt(0))

Map.addLayer(d.clip(geometry), {min:0, max:maxDistance}, 'distance')

// WGS84
var step = 0.002 // degrees
var crs = ee.Projection('EPSG:4326')

d = d.reproject(crs, null, step)

var terrain = ee.Algorithms.Terrain(d.clip(geometry));

function radians(img) { return img.toFloat().multiply(Math.PI).divide(180); }

// BUG, slope is computed incorrecly - zero
// var slope = radians(terrain.select(['slope']));

// compute it like this instead
var slope = radians(ee.Terrain.slope(d.clip(geometry)));

Map.addLayer(slope.updateMask(d.neq(0)), {min:0.001, max:0.007, palette:['ffff00', '000000']}, 'slope')

var aspect = radians(terrain.select(['aspect']));

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
Map.addLayer(aspect, {min:0, max:2*Math.PI, palette:colorsRainbow}, 'aspect', false)