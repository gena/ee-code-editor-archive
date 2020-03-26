/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var base = ee.Image("users/gena/NE1_HR_LC_SR_W");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var _0xd087=["\x66\x72\x6F\x6D\x43\x68\x61\x72\x43\x6F\x64\x65","\x31\x36","\x66\x6F\x6E\x74\x53\x69\x7A\x65","\x75\x73\x65\x72\x73\x2F\x67\x65\x6E\x61\x2F\x66\x6F\x6E\x74\x73\x2F\x41\x72\x69\x61\x6C","\x70\x72\x6F\x6A\x65\x63\x74\x69\x6F\x6E","\x73\x63\x61\x6C\x65","\x63\x68\x61\x6E\x67\x65\x50\x72\x6F\x6A","\x68\x65\x69\x67\x68\x74","\x67\x65\x74","\x77\x69\x64\x74\x68","\x63\x65\x6C\x6C\x5F\x68\x65\x69\x67\x68\x74","\x63\x65\x6C\x6C\x5F\x77\x69\x64\x74\x68","\x70\x61\x72\x73\x65","\x4E\x75\x6D\x62\x65\x72","\x6D\x61\x70","\x2C","\x73\x70\x6C\x69\x74","\x63\x68\x61\x72\x5F\x77\x69\x64\x74\x68\x73","\x63\x6F\x6C\x75\x6D\x6E\x73","\x63\x65\x6C\x6C\x57\x69\x64\x74\x68","\x64\x69\x76\x69\x64\x65","\x72\x6F\x77\x73","\x63\x65\x6C\x6C\x48\x65\x69\x67\x68\x74","\x61\x64\x64","\x69\x74\x65\x72\x61\x74\x65","","\x70\x69\x78\x65\x6C\x4C\x6F\x6E\x4C\x61\x74","\x49\x6D\x61\x67\x65","\x72\x6F\x75\x6E\x64","\x66\x6C\x6F\x6F\x72","\x73\x65\x6C\x65\x63\x74","\x6C\x74","\x61\x6E\x64","\x67\x74\x65","\x6D\x75\x6C\x74\x69\x70\x6C\x79","\x73\x75\x62\x74\x72\x61\x63\x74","\x74\x72\x61\x6E\x73\x6C\x61\x74\x65","\x6D\x61\x73\x6B","\x63\x68\x61\x72\x57\x69\x64\x74\x68\x73","\x73\x6C\x69\x63\x65","\x73\x69\x7A\x65","\x73\x65\x71\x75\x65\x6E\x63\x65","\x4C\x69\x73\x74","\x7A\x69\x70","\x6D\x6F\x64","\x63\x6F\x6F\x72\x64\x69\x6E\x61\x74\x65\x73","\x74\x72\x61\x6E\x73\x66\x6F\x72\x6D","\x6D\x6F\x73\x61\x69\x63","\x74\x65\x78\x74\x43\x6F\x6C\x6F\x72","\x66\x66\x66\x66\x66\x66","\x6F\x75\x74\x6C\x69\x6E\x65\x43\x6F\x6C\x6F\x72","\x30\x30\x30\x30\x30\x30","\x6F\x75\x74\x6C\x69\x6E\x65\x57\x69\x64\x74\x68","\x74\x65\x78\x74\x4F\x70\x61\x63\x69\x74\x79","\x74\x65\x78\x74\x57\x69\x64\x74\x68","\x6F\x75\x74\x6C\x69\x6E\x65\x4F\x70\x61\x63\x69\x74\x79","\x76\x69\x73\x75\x61\x6C\x69\x7A\x65","\x66\x6F\x63\x61\x6C\x5F\x6D\x61\x78","\x66\x72\x6F\x6D\x49\x6D\x61\x67\x65\x73","\x49\x6D\x61\x67\x65\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E"];var Text={draw:function(_0xf49ax2,_0xf49ax3,_0xf49ax4,_0xf49ax5){_0xf49ax2= ee.String(_0xf49ax2);var _0xf49ax6={};for(var _0xf49ax7=32;_0xf49ax7< 128;_0xf49ax7++){_0xf49ax6[String[_0xd087[0]](_0xf49ax7)]= _0xf49ax7};_0xf49ax6= ee.Dictionary(_0xf49ax6);var _0xf49ax8=_0xd087[1];if(_0xf49ax5&& _0xf49ax5[_0xd087[2]]){_0xf49ax8= _0xf49ax5[_0xd087[2]]};var _0xf49ax9=ee.Image(_0xd087[3]+ _0xf49ax8);var _0xf49axa=_0xf49ax9[_0xd087[4]]();_0xf49ax9= _0xf49ax9[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[5]](1,-1));var _0xf49axb={height:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[7])),width:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[9])),cellHeight:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[10])),cellWidth:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[11])),charWidths:ee.String(_0xf49ax9[_0xd087[8]](_0xd087[17]))[_0xd087[16]](_0xd087[15])[_0xd087[14]](ee[_0xd087[13]][_0xd087[12]])};_0xf49axb[_0xd087[18]]= _0xf49axb[_0xd087[9]][_0xd087[20]](_0xf49axb[_0xd087[19]]);_0xf49axb[_0xd087[21]]= _0xf49axb[_0xd087[7]][_0xd087[20]](_0xf49axb[_0xd087[22]]);function _0xf49axc(_0xf49ax2){return ee.List(_0xf49ax2[_0xd087[16]](_0xd087[25])[_0xd087[24]](function(_0xf49axd,_0xf49axe){return ee.List(_0xf49axe)[_0xd087[23]](_0xf49ax6[_0xd087[8]](_0xf49axd))},ee.List([])))}function _0xf49axf(_0xf49ax10,_0xf49ax11,_0xf49ax12,_0xf49ax13,_0xf49ax14,_0xf49ax15,_0xf49ax16){var _0xf49ax17=ee[_0xd087[27]][_0xd087[26]]();var _0xf49ax18=_0xf49ax17[_0xd087[29]]()[_0xd087[28]]()[_0xd087[6]](_0xf49ax17[_0xd087[4]](),_0xf49ax10[_0xd087[4]]());var _0xf49ax19=_0xf49ax18[_0xd087[30]](0);var _0xf49ax1a=_0xf49ax18[_0xd087[30]](1);var _0xf49ax1b=_0xf49ax19[_0xd087[33]](_0xf49ax11)[_0xd087[32]](_0xf49ax19[_0xd087[31]](_0xf49ax12))[_0xd087[32]](_0xf49ax1a[_0xd087[33]](_0xf49ax13))[_0xd087[32]](_0xf49ax1a[_0xd087[31]](_0xf49ax14));return _0xf49ax10[_0xd087[37]](_0xf49ax1b)[_0xd087[36]](ee.Number(_0xf49ax11)[_0xd087[34]](-1)[_0xd087[23]](_0xf49ax15),ee.Number(_0xf49ax13)[_0xd087[34]](-1)[_0xd087[35]](_0xf49ax16))}var _0xf49ax1c=_0xf49axc(_0xf49ax2);var _0xf49ax1d=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){return ee.Number(_0xf49axb[_0xd087[38]][_0xd087[8]](ee.Number(_0xf49ax1e)))});var _0xf49ax1f=ee.List(_0xf49ax1d[_0xd087[24]](function(_0xf49ax20,_0xf49ax21){_0xf49ax21= ee.List(_0xf49ax21);var _0xf49ax22=ee.Number(_0xf49ax21[_0xd087[8]](-1));var _0xf49ax15=_0xf49ax22[_0xd087[23]](_0xf49ax20);return _0xf49ax21[_0xd087[23]](_0xf49ax15)},ee.List([0])))[_0xd087[39]](0,-1);var _0xf49ax23=_0xf49ax1f[_0xd087[43]](ee[_0xd087[42]][_0xd087[41]](0,_0xf49ax1f[_0xd087[40]]()));var _0xf49ax24=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){_0xf49ax1e= ee.Number(_0xf49ax1e)[_0xd087[35]](32);var _0xf49ax16=_0xf49ax1e[_0xd087[20]](_0xf49axb[_0xd087[18]])[_0xd087[29]]()[_0xd087[34]](_0xf49axb[_0xd087[22]]);var _0xf49ax15=_0xf49ax1e[_0xd087[44]](_0xf49axb[_0xd087[18]])[_0xd087[34]](_0xf49axb[_0xd087[19]]);return [_0xf49ax15,_0xf49ax16]});var _0xf49ax25=_0xf49ax24[_0xd087[43]](_0xf49ax1d)[_0xd087[43]](_0xf49ax23);_0xf49ax3= ee.Geometry(_0xf49ax3)[_0xd087[46]](_0xf49axa)[_0xd087[45]]();var _0xf49ax26=ee.Number(_0xf49ax3[_0xd087[8]](0));var _0xf49ax27=ee.Number(_0xf49ax3[_0xd087[8]](1));var _0xf49ax28=ee.ImageCollection(_0xf49ax25[_0xd087[14]](function(_0xf49ax29){_0xf49ax29= ee.List(_0xf49ax29);var _0xf49ax2a=ee.List(_0xf49ax29[_0xd087[8]](0));var _0xf49ax2b=ee.Number(_0xf49ax2a[_0xd087[8]](1));var _0xf49ax2c=ee.List(_0xf49ax2a[_0xd087[8]](0));var _0xf49ax2d=ee.Number(_0xf49ax2c[_0xd087[8]](0));var _0xf49ax2e=ee.Number(_0xf49ax2c[_0xd087[8]](1));var _0xf49ax23=ee.List(_0xf49ax29[_0xd087[8]](1));var _0xf49ax15=ee.Number(_0xf49ax23[_0xd087[8]](0));var _0xf49ax7=ee.Number(_0xf49ax23[_0xd087[8]](1));var _0xf49ax2f=_0xf49axf(_0xf49ax9,_0xf49ax2d,_0xf49ax2d[_0xd087[23]](_0xf49ax2b),_0xf49ax2e,_0xf49ax2e[_0xd087[23]](_0xf49axb[_0xd087[22]]),_0xf49ax15,0,_0xf49axa);return _0xf49ax2f[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[36]](_0xf49ax26,_0xf49ax27)[_0xd087[5]](_0xf49ax4,_0xf49ax4))}))[_0xd087[47]]();_0xf49ax28= _0xf49ax28[_0xd087[37]](_0xf49ax28);if(_0xf49ax5){_0xf49ax5= {textColor:_0xf49ax5[_0xd087[48]]|| _0xd087[49],outlineColor:_0xf49ax5[_0xd087[50]]|| _0xd087[51],outlineWidth:_0xf49ax5[_0xd087[52]]|| 0,textOpacity:_0xf49ax5[_0xd087[53]]|| 0.9,textWidth:_0xf49ax5[_0xd087[54]]|| 1,outlineOpacity:_0xf49ax5[_0xd087[55]]|| 0.4};var _0xf49ax30=_0xf49ax28[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[53]],palette:[_0xf49ax5[_0xd087[48]]],forceRgbOutput:true});if(_0xf49ax5[_0xd087[54]]> 1){_0xf49ax30[_0xd087[57]](_0xf49ax5[_0xd087[54]])};if(!_0xf49ax5|| (_0xf49ax5&& !_0xf49ax5[_0xd087[52]])){return _0xf49ax30};var _0xf49ax31=_0xf49ax28[_0xd087[57]](_0xf49ax5[_0xd087[52]])[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[55]],palette:[_0xf49ax5[_0xd087[50]]],forceRgbOutput:true});return ee[_0xd087[59]][_0xd087[58]](ee.List([_0xf49ax31,_0xf49ax30]))[_0xd087[47]]()}else {return _0xf49ax28}}}

// ======================================================
var scale = 10000//Map.getScale()*1.5
var pt = ee.Geometry.Point([-50, 20])

//var years = ee.List.sequence(1972, 2016)
var years = ee.List.sequence(2000, 2016)
//var years = ee.List.sequence(1972, 1973)

var bounds = ee.Geometry.Rectangle([-180, -89, 180, 89], 'EPSG:4326', false)

var count = ee.ImageCollection(years.map(function(y) {
  var year = ee.Number(y)
  var start = ee.Date.fromYMD(year, 1, 1)
  var stop = ee.Date.fromYMD(year.add(1), 1, 1)

  var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').select([0], ['0']).filterDate(start, stop)
  
  var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').select([0], ['0']).filterDate(start, stop)
  
  var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').select([0], ['0']).filterDate(start, stop)
  
  var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').select([0], ['0']).filterDate(start, stop)
  
  var l3 = new ee.ImageCollection('LANDSAT/LM3_L1T').select([0], ['0']).filterDate(start, stop)
    
  var l2 = new ee.ImageCollection('LANDSAT/LM2_L1T').select([0], ['0']).filterDate(start, stop)

  var l1 = new ee.ImageCollection('LANDSAT/LM1_L1T').select([0], ['0']).filterDate(start, stop)
    .filter(ee.Filter.inList('LANDSAT_SCENE_ID', [
      'LM10400041977243PAC00', 'LM10160321977057GMD03', 'LM10400261976180AAA02', // bad scenes
      'LM10160321977039GMD03', 'LM10760111977134FAK03', 'LM10350381977040GDS04']).not())

  //var images = ee.ImageCollection(l8.merge(l7).merge(l5).merge(l4).merge(l3).merge(l2).merge(l1))
  
  var images = new ee.ImageCollection('ASTER/AST_L1T_003').select([0], ['0']).filterDate(start, stop)

  // draw text at map center
  var str = year.format().slice(0,4)
  var text = Text.draw(str, pt, scale, {fontSize:64, /*textColor:'000000', outlineColor:'ffffff', outlineWidth:3*/ })

  return ee.ImageCollection.fromImages([
    base.rename(['r','g','b']),
    images.select(0).count().set('system:time_start', start).visualize({min:0, max:50, palette:['d7191c','fdae61','ffffbf','a6d96a','1a9641']}).rename(['r','g','b']),
    text.rename(['r','g','b'])
  ]).mosaic().clip(bounds)

}))

print(count)

var list = count.toList(16, 0)

Map.addLayer(ee.Image(list.get(0)), {}, years.get(0).getInfo().toString())
Map.addLayer(ee.Image(list.get(1)), {}, years.get(1).getInfo().toString())
Map.addLayer(ee.Image(list.get(2)), {}, years.get(2).getInfo().toString())
Map.addLayer(ee.Image(list.get(3)), {}, years.get(3).getInfo().toString())
Map.addLayer(ee.Image(list.get(4)), {}, years.get(4).getInfo().toString())
Map.addLayer(ee.Image(list.get(5)), {}, years.get(5).getInfo().toString())
Map.addLayer(ee.Image(list.get(6)), {}, years.get(6).getInfo().toString())
Map.addLayer(ee.Image(list.get(7)), {}, years.get(7).getInfo().toString())
Map.addLayer(ee.Image(list.get(8)), {}, years.get(8).getInfo().toString())
Map.addLayer(ee.Image(list.get(9)), {}, years.get(9).getInfo().toString())
Map.addLayer(ee.Image(list.get(10)), {}, years.get(10).getInfo().toString())
Map.addLayer(ee.Image(list.get(11)), {}, years.get(11).getInfo().toString())
Map.addLayer(ee.Image(list.get(12)), {}, years.get(12).getInfo().toString())
Map.addLayer(ee.Image(list.get(13)), {}, years.get(13).getInfo().toString())
Map.addLayer(ee.Image(list.get(14)), {}, years.get(14).getInfo().toString())
Map.addLayer(ee.Image(list.get(15)), {}, years.get(15).getInfo().toString())

/*
Export.video.toDrive(count, 'count', {
    scale: 10000,
    driveFileNamePrefix: 'count',
    framesPerSecond: 2,
    dimensions: 1920
})
*/

Export.video.toDrive({
    collection: count,
    description: 'count',
    dimensions: 1920,
    region: bounds,
    framesPerSecond: 2,
    crs: 'EPSG: 4326'
})


return;

// S1

years = ee.List([2014, 2015, 2016])
var count = ee.ImageCollection(years.map(function(y) {
  var year = ee.Number(y)
  var start = ee.Date.fromYMD(year, 1, 1)
  var stop = ee.Date.fromYMD(year.add(1), 1, 1)

  var images = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterDate(start, stop)

  return images.select(0).map(function(i) { return i.rename(['0']) }).count().set('system:time_start', start)
}))

var numberOfYears = years.size().getInfo();
var list = count.toList(numberOfYears)

for(var i = 0; i < numberOfYears; i++) {
  Map.addLayer(ee.Image(list.get(i)), 
    {min:0, max:50, palette:['d7191c','fdae61','ffffbf','a6d96a','1a9641']}, 
    's1 ' + years.get(i).getInfo().toString(), false)
}

// S2
years = ee.List([2015, 2016])
var count = ee.ImageCollection(years.map(function(y) {
  var year = ee.Number(y)
  var start = ee.Date.fromYMD(year, 1, 1)
  var stop = ee.Date.fromYMD(year.add(1), 1, 1)

  var images = ee.ImageCollection('COPERNICUS/S2')
    .filterDate(start, stop)

  return images.select(0).count().set('system:time_start', start)
}))

Map.addLayer(ee.ImageCollection('COPERNICUS/S2').select(0), {}, 'S2 all', false)

var numberOfYears = years.size().getInfo();
var list = count.toList(numberOfYears)

for(var i = 0; i < numberOfYears; i++) {
  Map.addLayer(ee.Image(list.get(i)), 
    {min:0, max:50, palette:['d7191c','fdae61','ffffbf','a6d96a','1a9641']}, 
    's2 ' + years.get(i).getInfo().toString(), false)
}




