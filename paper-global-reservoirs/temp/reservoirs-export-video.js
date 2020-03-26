/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var pt1 = /* color: d63000 */ee.Geometry.Point([-120.1314640045166, 39.37166314187099]),
    geometry = /* color: 98ff00 */ee.Geometry.MultiPoint(),
    fa = ee.Image("WWF/HydroSHEDS/15ACC"),
    pt2 = /* color: 0b4a8b */ee.Geometry.Point([-120.13154983520508, 39.376241223915564]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var _0xd087=["\x66\x72\x6F\x6D\x43\x68\x61\x72\x43\x6F\x64\x65","\x31\x36","\x66\x6F\x6E\x74\x53\x69\x7A\x65","\x75\x73\x65\x72\x73\x2F\x67\x65\x6E\x61\x2F\x66\x6F\x6E\x74\x73\x2F\x41\x72\x69\x61\x6C","\x70\x72\x6F\x6A\x65\x63\x74\x69\x6F\x6E","\x73\x63\x61\x6C\x65","\x63\x68\x61\x6E\x67\x65\x50\x72\x6F\x6A","\x68\x65\x69\x67\x68\x74","\x67\x65\x74","\x77\x69\x64\x74\x68","\x63\x65\x6C\x6C\x5F\x68\x65\x69\x67\x68\x74","\x63\x65\x6C\x6C\x5F\x77\x69\x64\x74\x68","\x70\x61\x72\x73\x65","\x4E\x75\x6D\x62\x65\x72","\x6D\x61\x70","\x2C","\x73\x70\x6C\x69\x74","\x63\x68\x61\x72\x5F\x77\x69\x64\x74\x68\x73","\x63\x6F\x6C\x75\x6D\x6E\x73","\x63\x65\x6C\x6C\x57\x69\x64\x74\x68","\x64\x69\x76\x69\x64\x65","\x72\x6F\x77\x73","\x63\x65\x6C\x6C\x48\x65\x69\x67\x68\x74","\x61\x64\x64","\x69\x74\x65\x72\x61\x74\x65","","\x70\x69\x78\x65\x6C\x4C\x6F\x6E\x4C\x61\x74","\x49\x6D\x61\x67\x65","\x72\x6F\x75\x6E\x64","\x66\x6C\x6F\x6F\x72","\x73\x65\x6C\x65\x63\x74","\x6C\x74","\x61\x6E\x64","\x67\x74\x65","\x6D\x75\x6C\x74\x69\x70\x6C\x79","\x73\x75\x62\x74\x72\x61\x63\x74","\x74\x72\x61\x6E\x73\x6C\x61\x74\x65","\x6D\x61\x73\x6B","\x63\x68\x61\x72\x57\x69\x64\x74\x68\x73","\x73\x6C\x69\x63\x65","\x73\x69\x7A\x65","\x73\x65\x71\x75\x65\x6E\x63\x65","\x4C\x69\x73\x74","\x7A\x69\x70","\x6D\x6F\x64","\x63\x6F\x6F\x72\x64\x69\x6E\x61\x74\x65\x73","\x74\x72\x61\x6E\x73\x66\x6F\x72\x6D","\x6D\x6F\x73\x61\x69\x63","\x74\x65\x78\x74\x43\x6F\x6C\x6F\x72","\x66\x66\x66\x66\x66\x66","\x6F\x75\x74\x6C\x69\x6E\x65\x43\x6F\x6C\x6F\x72","\x30\x30\x30\x30\x30\x30","\x6F\x75\x74\x6C\x69\x6E\x65\x57\x69\x64\x74\x68","\x74\x65\x78\x74\x4F\x70\x61\x63\x69\x74\x79","\x74\x65\x78\x74\x57\x69\x64\x74\x68","\x6F\x75\x74\x6C\x69\x6E\x65\x4F\x70\x61\x63\x69\x74\x79","\x76\x69\x73\x75\x61\x6C\x69\x7A\x65","\x66\x6F\x63\x61\x6C\x5F\x6D\x61\x78","\x66\x72\x6F\x6D\x49\x6D\x61\x67\x65\x73","\x49\x6D\x61\x67\x65\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E"];var Text={draw:function(_0xf49ax2,_0xf49ax3,_0xf49ax4,_0xf49ax5){_0xf49ax2= ee.String(_0xf49ax2);var _0xf49ax6={};for(var _0xf49ax7=32;_0xf49ax7< 128;_0xf49ax7++){_0xf49ax6[String[_0xd087[0]](_0xf49ax7)]= _0xf49ax7};_0xf49ax6= ee.Dictionary(_0xf49ax6);var _0xf49ax8=_0xd087[1];if(_0xf49ax5&& _0xf49ax5[_0xd087[2]]){_0xf49ax8= _0xf49ax5[_0xd087[2]]};var _0xf49ax9=ee.Image(_0xd087[3]+ _0xf49ax8);var _0xf49axa=_0xf49ax9[_0xd087[4]]();_0xf49ax9= _0xf49ax9[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[5]](1,-1));var _0xf49axb={height:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[7])),width:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[9])),cellHeight:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[10])),cellWidth:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[11])),charWidths:ee.String(_0xf49ax9[_0xd087[8]](_0xd087[17]))[_0xd087[16]](_0xd087[15])[_0xd087[14]](ee[_0xd087[13]][_0xd087[12]])};_0xf49axb[_0xd087[18]]= _0xf49axb[_0xd087[9]][_0xd087[20]](_0xf49axb[_0xd087[19]]);_0xf49axb[_0xd087[21]]= _0xf49axb[_0xd087[7]][_0xd087[20]](_0xf49axb[_0xd087[22]]);function _0xf49axc(_0xf49ax2){return ee.List(_0xf49ax2[_0xd087[16]](_0xd087[25])[_0xd087[24]](function(_0xf49axd,_0xf49axe){return ee.List(_0xf49axe)[_0xd087[23]](_0xf49ax6[_0xd087[8]](_0xf49axd))},ee.List([])))}function _0xf49axf(_0xf49ax10,_0xf49ax11,_0xf49ax12,_0xf49ax13,_0xf49ax14,_0xf49ax15,_0xf49ax16){var _0xf49ax17=ee[_0xd087[27]][_0xd087[26]]();var _0xf49ax18=_0xf49ax17[_0xd087[29]]()[_0xd087[28]]()[_0xd087[6]](_0xf49ax17[_0xd087[4]](),_0xf49ax10[_0xd087[4]]());var _0xf49ax19=_0xf49ax18[_0xd087[30]](0);var _0xf49ax1a=_0xf49ax18[_0xd087[30]](1);var _0xf49ax1b=_0xf49ax19[_0xd087[33]](_0xf49ax11)[_0xd087[32]](_0xf49ax19[_0xd087[31]](_0xf49ax12))[_0xd087[32]](_0xf49ax1a[_0xd087[33]](_0xf49ax13))[_0xd087[32]](_0xf49ax1a[_0xd087[31]](_0xf49ax14));return _0xf49ax10[_0xd087[37]](_0xf49ax1b)[_0xd087[36]](ee.Number(_0xf49ax11)[_0xd087[34]](-1)[_0xd087[23]](_0xf49ax15),ee.Number(_0xf49ax13)[_0xd087[34]](-1)[_0xd087[35]](_0xf49ax16))}var _0xf49ax1c=_0xf49axc(_0xf49ax2);var _0xf49ax1d=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){return ee.Number(_0xf49axb[_0xd087[38]][_0xd087[8]](ee.Number(_0xf49ax1e)))});var _0xf49ax1f=ee.List(_0xf49ax1d[_0xd087[24]](function(_0xf49ax20,_0xf49ax21){_0xf49ax21= ee.List(_0xf49ax21);var _0xf49ax22=ee.Number(_0xf49ax21[_0xd087[8]](-1));var _0xf49ax15=_0xf49ax22[_0xd087[23]](_0xf49ax20);return _0xf49ax21[_0xd087[23]](_0xf49ax15)},ee.List([0])))[_0xd087[39]](0,-1);var _0xf49ax23=_0xf49ax1f[_0xd087[43]](ee[_0xd087[42]][_0xd087[41]](0,_0xf49ax1f[_0xd087[40]]()));var _0xf49ax24=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){_0xf49ax1e= ee.Number(_0xf49ax1e)[_0xd087[35]](32);var _0xf49ax16=_0xf49ax1e[_0xd087[20]](_0xf49axb[_0xd087[18]])[_0xd087[29]]()[_0xd087[34]](_0xf49axb[_0xd087[22]]);var _0xf49ax15=_0xf49ax1e[_0xd087[44]](_0xf49axb[_0xd087[18]])[_0xd087[34]](_0xf49axb[_0xd087[19]]);return [_0xf49ax15,_0xf49ax16]});var _0xf49ax25=_0xf49ax24[_0xd087[43]](_0xf49ax1d)[_0xd087[43]](_0xf49ax23);_0xf49ax3= ee.Geometry(_0xf49ax3)[_0xd087[46]](_0xf49axa)[_0xd087[45]]();var _0xf49ax26=ee.Number(_0xf49ax3[_0xd087[8]](0));var _0xf49ax27=ee.Number(_0xf49ax3[_0xd087[8]](1));var _0xf49ax28=ee.ImageCollection(_0xf49ax25[_0xd087[14]](function(_0xf49ax29){_0xf49ax29= ee.List(_0xf49ax29);var _0xf49ax2a=ee.List(_0xf49ax29[_0xd087[8]](0));var _0xf49ax2b=ee.Number(_0xf49ax2a[_0xd087[8]](1));var _0xf49ax2c=ee.List(_0xf49ax2a[_0xd087[8]](0));var _0xf49ax2d=ee.Number(_0xf49ax2c[_0xd087[8]](0));var _0xf49ax2e=ee.Number(_0xf49ax2c[_0xd087[8]](1));var _0xf49ax23=ee.List(_0xf49ax29[_0xd087[8]](1));var _0xf49ax15=ee.Number(_0xf49ax23[_0xd087[8]](0));var _0xf49ax7=ee.Number(_0xf49ax23[_0xd087[8]](1));var _0xf49ax2f=_0xf49axf(_0xf49ax9,_0xf49ax2d,_0xf49ax2d[_0xd087[23]](_0xf49ax2b),_0xf49ax2e,_0xf49ax2e[_0xd087[23]](_0xf49axb[_0xd087[22]]),_0xf49ax15,0,_0xf49axa);return _0xf49ax2f[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[36]](_0xf49ax26,_0xf49ax27)[_0xd087[5]](_0xf49ax4,_0xf49ax4))}))[_0xd087[47]]();_0xf49ax28= _0xf49ax28[_0xd087[37]](_0xf49ax28);if(_0xf49ax5){_0xf49ax5= {textColor:_0xf49ax5[_0xd087[48]]|| _0xd087[49],outlineColor:_0xf49ax5[_0xd087[50]]|| _0xd087[51],outlineWidth:_0xf49ax5[_0xd087[52]]|| 0,textOpacity:_0xf49ax5[_0xd087[53]]|| 0.9,textWidth:_0xf49ax5[_0xd087[54]]|| 1,outlineOpacity:_0xf49ax5[_0xd087[55]]|| 0.4};var _0xf49ax30=_0xf49ax28[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[53]],palette:[_0xf49ax5[_0xd087[48]]],forceRgbOutput:true});if(_0xf49ax5[_0xd087[54]]> 1){_0xf49ax30[_0xd087[57]](_0xf49ax5[_0xd087[54]])};if(!_0xf49ax5|| (_0xf49ax5&& !_0xf49ax5[_0xd087[52]])){return _0xf49ax30};var _0xf49ax31=_0xf49ax28[_0xd087[57]](_0xf49ax5[_0xd087[52]])[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[55]],palette:[_0xf49ax5[_0xd087[50]]],forceRgbOutput:true});return ee[_0xd087[59]][_0xd087[58]](ee.List([_0xf49ax31,_0xf49ax30]))[_0xd087[47]]()}else {return _0xf49ax28}}}


// lake and reservoir locations retrieved from USGS NWIS: http://maps.waterdata.usgs.gov/mapper/nwisquery.html?URL=http://waterdata.usgs.gov/usa/nwis/current?type=lake&format=sitefile_output&sitefile_output_format=xml&column_name=agency_cd&column_name=site_no&column_name=station_nm&column_name=site_tp_cd&column_name=dec_lat_va&column_name=dec_long_va&column_name=agency_use_cd
var reservoirs = ee.FeatureCollection('ft:10bIIDcBgxWa8yhZ1GrIIKkyc66yXZ0M6lBRjEj6k')

//var index = 240
//var reservoir = ee.Feature(reservoirs.toList(1, index).get(0))
var reservoir = ee.Feature(reservoirs.filter(ee.Filter.eq('code', 10340300)).first())
//Map.centerObject(reservoir, 15)

print(reservoir.get('description'))


Map.addLayer(reservoirs, {color: 'blue'}, 'reservoirs')

geometry = ee.Geometry(Map.getBounds(true))//reservoir.geometry().buffer(200)

var start = ee.Date.fromYMD(1984, 1, 1)
var stop = ee.Date.fromYMD(2017, 1, 1)
var w = 1920
var bounds = geometry.bounds()

var mission = 'landsat8'
//var mission = 'sentinel2'

if(mission === 'landsat8') {
  var bands = ['red', 'green', 'blue'];
  var bandsL8 = ['B6', 'B5', 'B3']
  var bandsL7 = ['B5', 'B4', 'B2']
  
  var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').filterDate(start, stop).select(bandsL8, bands);
  var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').filterDate(start, stop).select(bandsL7, bands);
  var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').filterDate(start, stop).select(bandsL7, bands);
  var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').filterDate(start, stop).select(bandsL7, bands);
  
  var vis = {min: 0.05, max: [0.4, 0.4, 0.5], gamma: 1.4, forceRgbOutput: true}
  var images = ee.ImageCollection(l8.merge(l7).merge(l5).merge(l4)).filterBounds(bounds.centroid(1))
}

if(mission === 'sentinel2') {
  var start = ee.Date.fromYMD(2013, 1, 1)
  var vis = {min: 500, max: [4500, 4500, 4500], forceRgbOutput: true}
  var images = ee.ImageCollection('COPERNICUS/S2')
    .filterBounds(bounds)
    .filterDate(start, stop).select(['B3', 'B8', 'B2'])
}

var scale = Map.getScale() * 2.

print(images.first()) 

/***
 * Render video frames.
 */
function render() {
  var videoFrames = images
    .sort('system:time_start')
    .map(function(i) {
      var image = i.visualize(vis)
        .resample('bicubic')
      
      var strDate = ee.Date(i.get('system:time_start')).format('YYYY-MM-dd')
      var str = ee.String('Date: ').cat(strDate)
      var textDate = Text.draw(str, pt1, scale, {fontSize:16})

      var str = ee.String('Id: ').cat(i.get('LANDSAT_SCENE_ID'))
      var textId = Text.draw(str, pt2, scale, {fontSize:16})
      
      return ee.ImageCollection.fromImages([
          image,
          textDate,
          textId
      ]).mosaic().set('name', strDate)
    });
    
  return ee.ImageCollection(videoFrames);
}

var videoFrames = render();

Export.video.toDrive({
    collection: videoFrames,
    description: 'surface-water-changes-',
    //dimensions: 1920,
    dimensions: 1024,
    region: bounds,
    framesPerSecond: 5,
    crs: 'EPSG: 4326',
    maxFrames: 5000
})

// add a few layers to map
if(mission == 'sentinel2') {
  var count = 4
} else {
  var count = 10
}
var list = videoFrames.toList(count, 0);
for(var i = 0; i < count; i++) {
  var image = ee.Image(list.get(i))
  var name = image.get('name').getInfo()
  Map.addLayer(image.clip(bounds), {}, name, i === 0);
}
  
Map.addLayer(fa.mask(fa.gt(500)), {palette: ['000044', '0000ff'], min:500, max:50000}, 'FA', false)
