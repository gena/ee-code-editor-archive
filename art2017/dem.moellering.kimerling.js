// Author: George Azzari
// This is my take on the my Moellering and Kimerling DEM viz
// from: http://blogs.esri.com/esri/arcgis/2008/05/23/aspect-slope-map/


// var terrain = ee.call('Terrain',ee.Image("USGS/SRTMGL1_003"));
var terrain = ee.call('Terrain',ee.Image("USGS/NED"));


//Get masks based on aspect value. Return an image with 5 bands (one per type of slope).
function getSlopeMasks(){
  var s = terrain.select("slope");
  var slo = ee.Image(0).where(s.gte(0).and(s.lt(5)), 10);
  slo = slo.where(s.gte(5).and(s.lt(20)),20);
  slo = slo.where(s.gte(20).and(s.lt(40)),30);
  slo = slo.where(s.gte(40),40);
  return slo.select([0],['SLO']);
}

//Get masks based on aspect value. Return an image with 5 bands (one per type of slope).
function getAspectMasks(){
  var a = terrain.select("aspect");
  var asp = ee.Image(0);
  asp = asp.where(a.gte(0).and(a.lt(22.5)), 1);
  asp = asp.where(a.gte(22.5).and(a.lt(67.5)), 2);
  asp = asp.where(a.gte(67.5).and(a.lt(112.5)), 3);
  asp = asp.where(a.gte(112.5).and(a.lt(157.5)), 4);
  asp = asp.where(a.gte(157.5).and(a.lt(202.5)), 5);
  asp = asp.where(a.gte(202.5).and(a.lt(247.5)), 6);
  asp = asp.where(a.gte(247.5).and(a.lt(292.5)), 7);
  asp = asp.where(a.gte(292.5).and(a.lt(337.5)), 8);
  asp = asp.where(a.gte(337.5).and(a.lt(359.5)), 1);
  return asp.select([0], ['ASP']);
}

 

var aspvals = [1, 2, 3, 4, 5, 6, 7, 8];
var slovals = [10, 20, 30, 40];
var aspvals1 = [11, 21, 31];

var slo = getSlopeMasks();
var asp = getAspectMasks();
var sloasp = slo.add(asp);

var from = [21, 22, 23, 24, 25, 26, 27, 28, 
            31, 32, 33, 34, 35, 36, 37, 38,
            41, 42, 43, 44, 45, 46, 47, 48];
var to = [2, 3, 4, 5, 6, 7, 8, 9,
          10, 11, 12, 13, 14, 15, 16, 17,
          18, 19, 20, 21, 22, 23, 24, 25];

var remapped = sloasp.remap(from, to, 1);

var palette = ['93A659', '669966', '669988', '5959A6', '806C93', 'A65959', 'A68659', 'A6A659',
               'ACD926', '4DAA4D', '49B692', '3333CC', '8059A6', 'D92626', 'D98E26', 'D9D926',
               'BFFF00', '33CC33', '33CC99', '1A1AE6', '8033CC', 'FF0000', 'FF9500', 'FFFF00'];
               
// Translate the parallel arrays of class numbers and colors into
// a single array describing the entire palette.
var final_palette = [];
for (var i = 0; i < to.length; ++i) {
  final_palette[to[i]] = palette[i];
}
// Fill in any unspecified values with a fill color, in this case grey.
for (var i = 0; i < final_palette.length; ++i) {
  if (final_palette[i] === undefined) {
    final_palette[i] = '#323232'//'999999';
  }
}

var image = remapped.add(remapped.int().subtract(180))

Map.centerObject(ee.Geometry.Point(-121.76628112792969, 46.85176355559636), 12)
Map.addLayer(remapped, {palette:final_palette, gain:1.2});
// Map.addLayer(image, {palette:final_palette, gain:1.2});


