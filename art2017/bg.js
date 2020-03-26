/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gena = ee.Image("users/gena/gena_web"),
    george = ee.Image("users/gena/george_web"),
    alex = ee.Image("users/gena/alex_web");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var geometry = /* color: #ffc82d */ee.Geometry.Point([-121.86962127685547, 46.96197913117444]),
    gena_pt = /* color: #d63000 */ee.Geometry.Point([-121.96781158447266, 46.90266531903043]),
    george_pt = /* color: #98ff00 */ee.Geometry.Point([-121.80782318115234, 46.90289989028934]),
    alex_pt = /* color: #0b4a8b */ee.Geometry.Point([-121.66603088378906, 46.9061837801476])
    
//My Moellering and Kimerling DEM
//from: http://blogs.esri.com/esri/arcgis/2008/05/23/aspect-slope-map/


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

// Map.centerObject(ee.Geometry.Point(-121.76628112792969, 46.85176355559636), 12)

remapped = remapped.visualize({palette:final_palette, gain:1.2, forceRgbOutput: true})

var images = ee.List([remapped])




// ==============================
// TEXT

var _0xd087=["\x66\x72\x6F\x6D\x43\x68\x61\x72\x43\x6F\x64\x65","\x31\x36","\x66\x6F\x6E\x74\x53\x69\x7A\x65","\x75\x73\x65\x72\x73\x2F\x67\x65\x6E\x61\x2F\x66\x6F\x6E\x74\x73\x2F\x41\x72\x69\x61\x6C","\x70\x72\x6F\x6A\x65\x63\x74\x69\x6F\x6E","\x73\x63\x61\x6C\x65","\x63\x68\x61\x6E\x67\x65\x50\x72\x6F\x6A","\x68\x65\x69\x67\x68\x74","\x67\x65\x74","\x77\x69\x64\x74\x68","\x63\x65\x6C\x6C\x5F\x68\x65\x69\x67\x68\x74","\x63\x65\x6C\x6C\x5F\x77\x69\x64\x74\x68","\x70\x61\x72\x73\x65","\x4E\x75\x6D\x62\x65\x72","\x6D\x61\x70","\x2C","\x73\x70\x6C\x69\x74","\x63\x68\x61\x72\x5F\x77\x69\x64\x74\x68\x73","\x63\x6F\x6C\x75\x6D\x6E\x73","\x63\x65\x6C\x6C\x57\x69\x64\x74\x68","\x64\x69\x76\x69\x64\x65","\x72\x6F\x77\x73","\x63\x65\x6C\x6C\x48\x65\x69\x67\x68\x74","\x61\x64\x64","\x69\x74\x65\x72\x61\x74\x65","","\x70\x69\x78\x65\x6C\x4C\x6F\x6E\x4C\x61\x74","\x49\x6D\x61\x67\x65","\x72\x6F\x75\x6E\x64","\x66\x6C\x6F\x6F\x72","\x73\x65\x6C\x65\x63\x74","\x6C\x74","\x61\x6E\x64","\x67\x74\x65","\x6D\x75\x6C\x74\x69\x70\x6C\x79","\x73\x75\x62\x74\x72\x61\x63\x74","\x74\x72\x61\x6E\x73\x6C\x61\x74\x65","\x6D\x61\x73\x6B","\x63\x68\x61\x72\x57\x69\x64\x74\x68\x73","\x73\x6C\x69\x63\x65","\x73\x69\x7A\x65","\x73\x65\x71\x75\x65\x6E\x63\x65","\x4C\x69\x73\x74","\x7A\x69\x70","\x6D\x6F\x64","\x63\x6F\x6F\x72\x64\x69\x6E\x61\x74\x65\x73","\x74\x72\x61\x6E\x73\x66\x6F\x72\x6D","\x6D\x6F\x73\x61\x69\x63","\x74\x65\x78\x74\x43\x6F\x6C\x6F\x72","\x66\x66\x66\x66\x66\x66","\x6F\x75\x74\x6C\x69\x6E\x65\x43\x6F\x6C\x6F\x72","\x30\x30\x30\x30\x30\x30","\x6F\x75\x74\x6C\x69\x6E\x65\x57\x69\x64\x74\x68","\x74\x65\x78\x74\x4F\x70\x61\x63\x69\x74\x79","\x74\x65\x78\x74\x57\x69\x64\x74\x68","\x6F\x75\x74\x6C\x69\x6E\x65\x4F\x70\x61\x63\x69\x74\x79","\x76\x69\x73\x75\x61\x6C\x69\x7A\x65","\x66\x6F\x63\x61\x6C\x5F\x6D\x61\x78","\x66\x72\x6F\x6D\x49\x6D\x61\x67\x65\x73","\x49\x6D\x61\x67\x65\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E"];var Text={draw:function(_0xf49ax2,_0xf49ax3,_0xf49ax4,_0xf49ax5){_0xf49ax2= ee.String(_0xf49ax2);var _0xf49ax6={};for(var _0xf49ax7=32;_0xf49ax7< 128;_0xf49ax7++){_0xf49ax6[String[_0xd087[0]](_0xf49ax7)]= _0xf49ax7};_0xf49ax6= ee.Dictionary(_0xf49ax6);var _0xf49ax8=_0xd087[1];if(_0xf49ax5&& _0xf49ax5[_0xd087[2]]){_0xf49ax8= _0xf49ax5[_0xd087[2]]};var _0xf49ax9=ee.Image(_0xd087[3]+ _0xf49ax8);var _0xf49axa=_0xf49ax9[_0xd087[4]]();_0xf49ax9= _0xf49ax9[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[5]](1,-1));var _0xf49axb={height:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[7])),width:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[9])),cellHeight:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[10])),cellWidth:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[11])),charWidths:ee.String(_0xf49ax9[_0xd087[8]](_0xd087[17]))[_0xd087[16]](_0xd087[15])[_0xd087[14]](ee[_0xd087[13]][_0xd087[12]])};_0xf49axb[_0xd087[18]]= _0xf49axb[_0xd087[9]][_0xd087[20]](_0xf49axb[_0xd087[19]]);_0xf49axb[_0xd087[21]]= _0xf49axb[_0xd087[7]][_0xd087[20]](_0xf49axb[_0xd087[22]]);function _0xf49axc(_0xf49ax2){return ee.List(_0xf49ax2[_0xd087[16]](_0xd087[25])[_0xd087[24]](function(_0xf49axd,_0xf49axe){return ee.List(_0xf49axe)[_0xd087[23]](_0xf49ax6[_0xd087[8]](_0xf49axd))},ee.List([])))}function _0xf49axf(_0xf49ax10,_0xf49ax11,_0xf49ax12,_0xf49ax13,_0xf49ax14,_0xf49ax15,_0xf49ax16){var _0xf49ax17=ee[_0xd087[27]][_0xd087[26]]();var _0xf49ax18=_0xf49ax17[_0xd087[29]]()[_0xd087[28]]()[_0xd087[6]](_0xf49ax17[_0xd087[4]](),_0xf49ax10[_0xd087[4]]());var _0xf49ax19=_0xf49ax18[_0xd087[30]](0);var _0xf49ax1a=_0xf49ax18[_0xd087[30]](1);var _0xf49ax1b=_0xf49ax19[_0xd087[33]](_0xf49ax11)[_0xd087[32]](_0xf49ax19[_0xd087[31]](_0xf49ax12))[_0xd087[32]](_0xf49ax1a[_0xd087[33]](_0xf49ax13))[_0xd087[32]](_0xf49ax1a[_0xd087[31]](_0xf49ax14));return _0xf49ax10[_0xd087[37]](_0xf49ax1b)[_0xd087[36]](ee.Number(_0xf49ax11)[_0xd087[34]](-1)[_0xd087[23]](_0xf49ax15),ee.Number(_0xf49ax13)[_0xd087[34]](-1)[_0xd087[35]](_0xf49ax16))}var _0xf49ax1c=_0xf49axc(_0xf49ax2);var _0xf49ax1d=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){return ee.Number(_0xf49axb[_0xd087[38]][_0xd087[8]](ee.Number(_0xf49ax1e)))});var _0xf49ax1f=ee.List(_0xf49ax1d[_0xd087[24]](function(_0xf49ax20,_0xf49ax21){_0xf49ax21= ee.List(_0xf49ax21);var _0xf49ax22=ee.Number(_0xf49ax21[_0xd087[8]](-1));var _0xf49ax15=_0xf49ax22[_0xd087[23]](_0xf49ax20);return _0xf49ax21[_0xd087[23]](_0xf49ax15)},ee.List([0])))[_0xd087[39]](0,-1);var _0xf49ax23=_0xf49ax1f[_0xd087[43]](ee[_0xd087[42]][_0xd087[41]](0,_0xf49ax1f[_0xd087[40]]()));var _0xf49ax24=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){_0xf49ax1e= ee.Number(_0xf49ax1e)[_0xd087[35]](32);var _0xf49ax16=_0xf49ax1e[_0xd087[20]](_0xf49axb[_0xd087[18]])[_0xd087[29]]()[_0xd087[34]](_0xf49axb[_0xd087[22]]);var _0xf49ax15=_0xf49ax1e[_0xd087[44]](_0xf49axb[_0xd087[18]])[_0xd087[34]](_0xf49axb[_0xd087[19]]);return [_0xf49ax15,_0xf49ax16]});var _0xf49ax25=_0xf49ax24[_0xd087[43]](_0xf49ax1d)[_0xd087[43]](_0xf49ax23);_0xf49ax3= ee.Geometry(_0xf49ax3)[_0xd087[46]](_0xf49axa)[_0xd087[45]]();var _0xf49ax26=ee.Number(_0xf49ax3[_0xd087[8]](0));var _0xf49ax27=ee.Number(_0xf49ax3[_0xd087[8]](1));var _0xf49ax28=ee.ImageCollection(_0xf49ax25[_0xd087[14]](function(_0xf49ax29){_0xf49ax29= ee.List(_0xf49ax29);var _0xf49ax2a=ee.List(_0xf49ax29[_0xd087[8]](0));var _0xf49ax2b=ee.Number(_0xf49ax2a[_0xd087[8]](1));var _0xf49ax2c=ee.List(_0xf49ax2a[_0xd087[8]](0));var _0xf49ax2d=ee.Number(_0xf49ax2c[_0xd087[8]](0));var _0xf49ax2e=ee.Number(_0xf49ax2c[_0xd087[8]](1));var _0xf49ax23=ee.List(_0xf49ax29[_0xd087[8]](1));var _0xf49ax15=ee.Number(_0xf49ax23[_0xd087[8]](0));var _0xf49ax7=ee.Number(_0xf49ax23[_0xd087[8]](1));var _0xf49ax2f=_0xf49axf(_0xf49ax9,_0xf49ax2d,_0xf49ax2d[_0xd087[23]](_0xf49ax2b),_0xf49ax2e,_0xf49ax2e[_0xd087[23]](_0xf49axb[_0xd087[22]]),_0xf49ax15,0,_0xf49axa);return _0xf49ax2f[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[36]](_0xf49ax26,_0xf49ax27)[_0xd087[5]](_0xf49ax4,_0xf49ax4))}))[_0xd087[47]]();_0xf49ax28= _0xf49ax28[_0xd087[37]](_0xf49ax28);if(_0xf49ax5){_0xf49ax5= {textColor:_0xf49ax5[_0xd087[48]]|| _0xd087[49],outlineColor:_0xf49ax5[_0xd087[50]]|| _0xd087[51],outlineWidth:_0xf49ax5[_0xd087[52]]|| 0,textOpacity:_0xf49ax5[_0xd087[53]]|| 0.9,textWidth:_0xf49ax5[_0xd087[54]]|| 1,outlineOpacity:_0xf49ax5[_0xd087[55]]|| 0.4};var _0xf49ax30=_0xf49ax28[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[53]],palette:[_0xf49ax5[_0xd087[48]]],forceRgbOutput:true});if(_0xf49ax5[_0xd087[54]]> 1){_0xf49ax30[_0xd087[57]](_0xf49ax5[_0xd087[54]])};if(!_0xf49ax5|| (_0xf49ax5&& !_0xf49ax5[_0xd087[52]])){return _0xf49ax30};var _0xf49ax31=_0xf49ax28[_0xd087[57]](_0xf49ax5[_0xd087[52]])[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[55]],palette:[_0xf49ax5[_0xd087[50]]],forceRgbOutput:true});return ee[_0xd087[59]][_0xd087[58]](ee.List([_0xf49ax31,_0xf49ax30]))[_0xd087[47]]()}else {return _0xf49ax28}}}

// dim background
var bg = ee.Image(1).visualize({palette:['000000'], opacity:0.4, forceRgbOutput:true})

images = images.add(bg)



// scale text font relative to the current map scale
var scale = Map.getScale() * 2.0 

// stress test, multiple strings
var bounds = Map.getBounds(true)


// sample multiple points and paint their coordinates
var count = 100
var samples = ee.Image.pixelLonLat().sample({region: bounds, numPixels: count, scale: 1})
  .map(sampleFeatureToPoint)
  .randomColumn('message')

// draw text
var scale = Map.getScale()

var strings = ee.List([
    'getInfo(images.map(classify))', 
    'ee.String("I am not a String!")',
    'images.map(function(i) { print("Oh!") })',
    'for(var i=0; i<1000; i++) { images = images.add(image) }',
    'maxPixels: 1e100',
    'images.toList(100000).get(100000)'
    ])


var samplesText = ee.ImageCollection(samples.map(function(f) { 
  var pos = ee.Geometry(f.geometry())
  var str = strings.get(ee.Number(f.get('message')).multiply(strings.size()).floor())
  
  return Text.draw(str, pos, scale, { fontSize: 18, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 2, outlineOpacity: 0.8}) 
}))

images = images.add(samplesText.mosaic())

// utils
function sampleFeatureToPoint(f) { 
  return ee.Feature(ee.Algorithms.GeometryConstructors.Point(ee.List([f.get('longitude'), f.get('latitude')])))
}

george_pt = george_pt.transform('EPSG:3857')
gena_pt = gena_pt.transform('EPSG:3857')
alex_pt = alex_pt.transform('EPSG:3857')

function movePhoto(image, location, name) {
  image = image
    .changeProj(image.projection(), image.projection().scale(10,10))
    .translate(location.coordinates().get(0), location.coordinates().get(1), 'meters', 'EPSG:3857')
    .visualize({forceRgbOutput: true})
  
  var frame = ee.Image()
    .paint(image.geometry().buffer(Map.getScale()*5), 1)
    .visualize({palette:['000000'], forceRgbOutput:true})
  
  //Map.addLayer(frame, {}, name + ' frame')
  //Map.addLayer(image, {}, name)

  images = images.add(frame)
  images = images.add(image)
}

movePhoto(george, george_pt, 'george')
movePhoto(alex, alex_pt, 'alex')
movePhoto(gena, gena_pt, 'gena')

var error = Text.draw('Internal Server Error!', geometry, Map.getScale()*2, { fontSize: 32, textColor: 'ff0000', outlineColor: 'ffffff', outlineWidth: 2, outlineOpacity: 0.8}) 

images = images.add(error)




var all = ee.ImageCollection.fromImages(images).mosaic()

Map.addLayer(remapped, {}, 'bg', false);
Map.addLayer(bg, {}, 'dim', false)
Map.addLayer(samplesText.mosaic(), {}, 'text', false)
Map.addLayer(error, {}, 'error', false)


Map.addLayer(all, {}, 'all')





/***
 * Computes export video / image parameters: scale, rect.
 */
function generateExportParameters(bounds, w, h) {
  w = ee.Number(w)
  h = ee.Number(h)
  
  // get width / height
  var coords = ee.List(bounds.coordinates().get(0))
  var ymin = ee.Number(ee.List(coords.get(0)).get(1))
  var ymax = ee.Number(ee.List(coords.get(2)).get(1))
  var xmin = ee.Number(ee.List(coords.get(0)).get(0))
  var xmax = ee.Number(ee.List(coords.get(1)).get(0))
  var width = xmax.subtract(xmin)
  var height = ymax.subtract(ymin)

  // compute new height, ymin, ymax and bounds
  var ratio = w.divide(h)
  var ycenter = ymin.add(height.divide(2.0))

  height = width.divide(ratio)
  
  ymin = ycenter.subtract(height.divide(2.0))
  ymax = ycenter.add(height.divide(2.0))
  
  bounds = ee.Geometry.Rectangle([xmin, ymin, xmax, ymax], 'EPSG:3857')
  
  var scale = bounds.projection().nominalScale().multiply(width.divide(w))

  return {scale: scale, bounds: bounds}  
}


var width = 1920;
var height = 1080; 
var image_export_region = generateExportParameters(ee.Geometry(Map.getBounds(true)).transform('EPSG:3857', 10), width, height);

//Map.addLayer(image_export_region.bounds)

Export.image.toDrive({
  image: all,
  description: 'TheTroublemakersArt',
  dimensions: width + 'x' + height,
  region: image_export_region.bounds,
  crs: 'EPSG:3857'
});
