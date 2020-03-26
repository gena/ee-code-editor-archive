/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var reservoir_prosser_creek = /* color: d63000 */ee.Geometry.Polygon(
        [[[73.06328755717857, 40.75414750292487],
          [73.06491751575959, 40.740623415712065],
          [73.06938077283212, 40.73307923176494],
          [73.07109740984163, 40.74101360896686],
          [73.07298571042384, 40.75479896426042],
          [73.07264238276753, 40.76195061687737],
          [73.08912210062954, 40.75661945814981],
          [73.09942192416543, 40.758699961401824],
          [73.10182521649006, 40.747906644183246],
          [73.10972174788151, 40.745825803343884],
          [73.10731845590772, 40.73060767556591],
          [73.10646013736402, 40.72436333404177],
          [73.10723304399676, 40.71831362365025],
          [73.11075173057077, 40.712523495010124],
          [73.12233878047232, 40.71154775526738],
          [73.13289642584164, 40.70809939237788],
          [73.14791533118728, 40.71219792255385],
          [73.1519508690941, 40.728786464371744],
          [73.14525613892852, 40.73359954829791],
          [73.14456948405484, 40.73737171775167],
          [73.1460287293853, 40.74198880075892],
          [73.13924790863985, 40.75011746641381],
          [73.12465649193109, 40.75961016119147],
          [73.13032139489735, 40.76598120980143],
          [73.1397628998925, 40.76975154272746],
          [73.15023438726769, 40.77131161788428],
          [73.16225084808138, 40.764421009336836],
          [73.16813080867564, 40.758440017014756],
          [73.17812961162531, 40.755319108062245],
          [73.18984608392509, 40.749466900937875],
          [73.20568169026626, 40.75752972402062],
          [73.20791331702367, 40.768581478395205],
          [73.19572507874511, 40.77950124637495],
          [73.17976054874487, 40.78730027652025],
          [73.17461063704286, 40.79496826756636],
          [73.17881570584632, 40.8008811828629],
          [73.21083168452162, 40.81043152061581],
          [73.21735490832202, 40.8121858766589],
          [73.21838540334716, 40.81939683639208],
          [73.20645480497092, 40.83284161462733],
          [73.1802755409675, 40.83147654644291],
          [73.16860182276957, 40.82615169985315],
          [73.1569292731914, 40.817057527266904],
          [73.15143603373133, 40.810431521428356],
          [73.14285286327504, 40.800946076418974],
          [73.13358300573282, 40.7941885003659],
          [73.12431316436619, 40.79067950063128],
          [73.11006507489037, 40.78795014085973],
          [73.0997652512101, 40.78509069123826],
          [73.08053891368832, 40.78223111835456],
          [73.06714914303393, 40.77742155920025],
          [73.06199923125905, 40.77560163518374],
          [73.0596815725196, 40.774301644541914],
          [73.05787934899513, 40.77066158324373],
          [73.0573219374188, 40.767085215685604]]]),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    reservoir_bocca = /* color: 98ff00 */ee.Geometry.Polygon(
        [[[-120.08673678154707, 39.40887484669061],
          [-120.08124425836871, 39.418427216838595],
          [-120.07910041286829, 39.42817393517901],
          [-120.08107640444416, 39.43526874001576],
          [-120.08923395774553, 39.42406509693503],
          [-120.10082320373408, 39.424529126828716],
          [-120.10555197570488, 39.41630853344285],
          [-120.1090714340026, 39.40940954107205],
          [-120.11233125349537, 39.40403241381146],
          [-120.10872354001333, 39.39308584106037],
          [-120.09361352203166, 39.38791036777472],
          [-120.08519949624144, 39.39308604950127],
          [-120.08279218465248, 39.401047301141176]]]),
    glcf = ee.ImageCollection("GLCF/GLS_WATER"),
    l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA"),
    pt_date = /* color: ffc82d */ee.Geometry.Point([-120.18733978271484, 39.38270974109091]),
    pt_cloud = /* color: 00ffff */ee.Geometry.Point([-120.18738269805908, 39.37819842825372]),
    pt_snow = /* color: bf04c2 */ee.Geometry.Point([-120.18746852874756, 39.376307570723895]),
    pt_area = /* color: ff0000 */ee.Geometry.Point([-120.18738269805908, 39.38101803294523]),
    pt_ndwi = /* color: 00ff00 */ee.Geometry.Point([-120.18759727478027, 39.37358729988046]),
    s2 = ee.ImageCollection("COPERNICUS/S2"),
    s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    proba100 = ee.ImageCollection("VITO/PROBAV/S1_TOC_100M"),
    proba333 = ee.ImageCollection("VITO/PROBAV/S1_TOC_333M"),
    reservoir_LochDoon = /* color: 0000ff */ee.Geometry.Polygon(
        [[[-4.3856048583984375, 55.20062248702424],
          [-4.376335144042969, 55.21061396370732],
          [-4.36981201171875, 55.2188403559775],
          [-4.3622589111328125, 55.22784826332078],
          [-4.360198974609375, 55.23685413136347],
          [-4.35333251953125, 55.244879382047415],
          [-4.353675842285156, 55.25349004438312],
          [-4.351959228515625, 55.260142460486485],
          [-4.3471527099609375, 55.260925024458885],
          [-4.342689514160156, 55.26503323244173],
          [-4.356422424316406, 55.2693366137426],
          [-4.366722106933594, 55.273443951903346],
          [-4.373588562011719, 55.268945416525725],
          [-4.3828582763671875, 55.2718793017382],
          [-4.390411376953125, 55.286740989579336],
          [-4.4000244140625, 55.28791404380969],
          [-4.405174255371094, 55.28459030011508],
          [-4.4020843505859375, 55.26972780710658],
          [-4.394874572753906, 55.25701205045982],
          [-4.381828308105469, 55.25603374674919],
          [-4.3773651123046875, 55.24605367311375],
          [-4.3780517578125, 55.23411343086893],
          [-4.399681091308594, 55.218448661568296],
          [-4.3910980224609375, 55.202777723496354]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//var dem = ee.Image('USGS/SRTMGL1_003'); 
//var dem_name = 'SRTM 30m'

var dem = ee.Image('USGS/NED');
var dem_name = 'NED 10m'

Map.addLayer(dem, {}, 'dem (raw)', true)


var _0xd087=["\x66\x72\x6F\x6D\x43\x68\x61\x72\x43\x6F\x64\x65","\x31\x36","\x66\x6F\x6E\x74\x53\x69\x7A\x65","\x75\x73\x65\x72\x73\x2F\x67\x65\x6E\x61\x2F\x66\x6F\x6E\x74\x73\x2F\x41\x72\x69\x61\x6C","\x70\x72\x6F\x6A\x65\x63\x74\x69\x6F\x6E","\x73\x63\x61\x6C\x65","\x63\x68\x61\x6E\x67\x65\x50\x72\x6F\x6A","\x68\x65\x69\x67\x68\x74","\x67\x65\x74","\x77\x69\x64\x74\x68","\x63\x65\x6C\x6C\x5F\x68\x65\x69\x67\x68\x74","\x63\x65\x6C\x6C\x5F\x77\x69\x64\x74\x68","\x70\x61\x72\x73\x65","\x4E\x75\x6D\x62\x65\x72","\x6D\x61\x70","\x2C","\x73\x70\x6C\x69\x74","\x63\x68\x61\x72\x5F\x77\x69\x64\x74\x68\x73","\x63\x6F\x6C\x75\x6D\x6E\x73","\x63\x65\x6C\x6C\x57\x69\x64\x74\x68","\x64\x69\x76\x69\x64\x65","\x72\x6F\x77\x73","\x63\x65\x6C\x6C\x48\x65\x69\x67\x68\x74","\x61\x64\x64","\x69\x74\x65\x72\x61\x74\x65","","\x70\x69\x78\x65\x6C\x4C\x6F\x6E\x4C\x61\x74","\x49\x6D\x61\x67\x65","\x72\x6F\x75\x6E\x64","\x66\x6C\x6F\x6F\x72","\x73\x65\x6C\x65\x63\x74","\x6C\x74","\x61\x6E\x64","\x67\x74\x65","\x6D\x75\x6C\x74\x69\x70\x6C\x79","\x73\x75\x62\x74\x72\x61\x63\x74","\x74\x72\x61\x6E\x73\x6C\x61\x74\x65","\x6D\x61\x73\x6B","\x63\x68\x61\x72\x57\x69\x64\x74\x68\x73","\x73\x6C\x69\x63\x65","\x73\x69\x7A\x65","\x73\x65\x71\x75\x65\x6E\x63\x65","\x4C\x69\x73\x74","\x7A\x69\x70","\x6D\x6F\x64","\x63\x6F\x6F\x72\x64\x69\x6E\x61\x74\x65\x73","\x74\x72\x61\x6E\x73\x66\x6F\x72\x6D","\x6D\x6F\x73\x61\x69\x63","\x74\x65\x78\x74\x43\x6F\x6C\x6F\x72","\x66\x66\x66\x66\x66\x66","\x6F\x75\x74\x6C\x69\x6E\x65\x43\x6F\x6C\x6F\x72","\x30\x30\x30\x30\x30\x30","\x6F\x75\x74\x6C\x69\x6E\x65\x57\x69\x64\x74\x68","\x74\x65\x78\x74\x4F\x70\x61\x63\x69\x74\x79","\x74\x65\x78\x74\x57\x69\x64\x74\x68","\x6F\x75\x74\x6C\x69\x6E\x65\x4F\x70\x61\x63\x69\x74\x79","\x76\x69\x73\x75\x61\x6C\x69\x7A\x65","\x66\x6F\x63\x61\x6C\x5F\x6D\x61\x78","\x66\x72\x6F\x6D\x49\x6D\x61\x67\x65\x73","\x49\x6D\x61\x67\x65\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E"];var Text={draw:function(_0xf49ax2,_0xf49ax3,_0xf49ax4,_0xf49ax5){_0xf49ax2= ee.String(_0xf49ax2);var _0xf49ax6={};for(var _0xf49ax7=32;_0xf49ax7< 128;_0xf49ax7++){_0xf49ax6[String[_0xd087[0]](_0xf49ax7)]= _0xf49ax7};_0xf49ax6= ee.Dictionary(_0xf49ax6);var _0xf49ax8=_0xd087[1];if(_0xf49ax5&& _0xf49ax5[_0xd087[2]]){_0xf49ax8= _0xf49ax5[_0xd087[2]]};var _0xf49ax9=ee.Image(_0xd087[3]+ _0xf49ax8);var _0xf49axa=_0xf49ax9[_0xd087[4]]();_0xf49ax9= _0xf49ax9[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[5]](1,-1));var _0xf49axb={height:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[7])),width:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[9])),cellHeight:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[10])),cellWidth:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[11])),charWidths:ee.String(_0xf49ax9[_0xd087[8]](_0xd087[17]))[_0xd087[16]](_0xd087[15])[_0xd087[14]](ee[_0xd087[13]][_0xd087[12]])};_0xf49axb[_0xd087[18]]= _0xf49axb[_0xd087[9]][_0xd087[20]](_0xf49axb[_0xd087[19]]);_0xf49axb[_0xd087[21]]= _0xf49axb[_0xd087[7]][_0xd087[20]](_0xf49axb[_0xd087[22]]);function _0xf49axc(_0xf49ax2){return ee.List(_0xf49ax2[_0xd087[16]](_0xd087[25])[_0xd087[24]](function(_0xf49axd,_0xf49axe){return ee.List(_0xf49axe)[_0xd087[23]](_0xf49ax6[_0xd087[8]](_0xf49axd))},ee.List([])))}function _0xf49axf(_0xf49ax10,_0xf49ax11,_0xf49ax12,_0xf49ax13,_0xf49ax14,_0xf49ax15,_0xf49ax16){var _0xf49ax17=ee[_0xd087[27]][_0xd087[26]]();var _0xf49ax18=_0xf49ax17[_0xd087[29]]()[_0xd087[28]]()[_0xd087[6]](_0xf49ax17[_0xd087[4]](),_0xf49ax10[_0xd087[4]]());var _0xf49ax19=_0xf49ax18[_0xd087[30]](0);var _0xf49ax1a=_0xf49ax18[_0xd087[30]](1);var _0xf49ax1b=_0xf49ax19[_0xd087[33]](_0xf49ax11)[_0xd087[32]](_0xf49ax19[_0xd087[31]](_0xf49ax12))[_0xd087[32]](_0xf49ax1a[_0xd087[33]](_0xf49ax13))[_0xd087[32]](_0xf49ax1a[_0xd087[31]](_0xf49ax14));return _0xf49ax10[_0xd087[37]](_0xf49ax1b)[_0xd087[36]](ee.Number(_0xf49ax11)[_0xd087[34]](-1)[_0xd087[23]](_0xf49ax15),ee.Number(_0xf49ax13)[_0xd087[34]](-1)[_0xd087[35]](_0xf49ax16))}var _0xf49ax1c=_0xf49axc(_0xf49ax2);var _0xf49ax1d=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){return ee.Number(_0xf49axb[_0xd087[38]][_0xd087[8]](ee.Number(_0xf49ax1e)))});var _0xf49ax1f=ee.List(_0xf49ax1d[_0xd087[24]](function(_0xf49ax20,_0xf49ax21){_0xf49ax21= ee.List(_0xf49ax21);var _0xf49ax22=ee.Number(_0xf49ax21[_0xd087[8]](-1));var _0xf49ax15=_0xf49ax22[_0xd087[23]](_0xf49ax20);return _0xf49ax21[_0xd087[23]](_0xf49ax15)},ee.List([0])))[_0xd087[39]](0,-1);var _0xf49ax23=_0xf49ax1f[_0xd087[43]](ee[_0xd087[42]][_0xd087[41]](0,_0xf49ax1f[_0xd087[40]]()));var _0xf49ax24=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){_0xf49ax1e= ee.Number(_0xf49ax1e)[_0xd087[35]](32);var _0xf49ax16=_0xf49ax1e[_0xd087[20]](_0xf49axb[_0xd087[18]])[_0xd087[29]]()[_0xd087[34]](_0xf49axb[_0xd087[22]]);var _0xf49ax15=_0xf49ax1e[_0xd087[44]](_0xf49axb[_0xd087[18]])[_0xd087[34]](_0xf49axb[_0xd087[19]]);return [_0xf49ax15,_0xf49ax16]});var _0xf49ax25=_0xf49ax24[_0xd087[43]](_0xf49ax1d)[_0xd087[43]](_0xf49ax23);_0xf49ax3= ee.Geometry(_0xf49ax3)[_0xd087[46]](_0xf49axa)[_0xd087[45]]();var _0xf49ax26=ee.Number(_0xf49ax3[_0xd087[8]](0));var _0xf49ax27=ee.Number(_0xf49ax3[_0xd087[8]](1));var _0xf49ax28=ee.ImageCollection(_0xf49ax25[_0xd087[14]](function(_0xf49ax29){_0xf49ax29= ee.List(_0xf49ax29);var _0xf49ax2a=ee.List(_0xf49ax29[_0xd087[8]](0));var _0xf49ax2b=ee.Number(_0xf49ax2a[_0xd087[8]](1));var _0xf49ax2c=ee.List(_0xf49ax2a[_0xd087[8]](0));var _0xf49ax2d=ee.Number(_0xf49ax2c[_0xd087[8]](0));var _0xf49ax2e=ee.Number(_0xf49ax2c[_0xd087[8]](1));var _0xf49ax23=ee.List(_0xf49ax29[_0xd087[8]](1));var _0xf49ax15=ee.Number(_0xf49ax23[_0xd087[8]](0));var _0xf49ax7=ee.Number(_0xf49ax23[_0xd087[8]](1));var _0xf49ax2f=_0xf49axf(_0xf49ax9,_0xf49ax2d,_0xf49ax2d[_0xd087[23]](_0xf49ax2b),_0xf49ax2e,_0xf49ax2e[_0xd087[23]](_0xf49axb[_0xd087[22]]),_0xf49ax15,0,_0xf49axa);return _0xf49ax2f[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[36]](_0xf49ax26,_0xf49ax27)[_0xd087[5]](_0xf49ax4,_0xf49ax4))}))[_0xd087[47]]();_0xf49ax28= _0xf49ax28[_0xd087[37]](_0xf49ax28);if(_0xf49ax5){_0xf49ax5= {textColor:_0xf49ax5[_0xd087[48]]|| _0xd087[49],outlineColor:_0xf49ax5[_0xd087[50]]|| _0xd087[51],outlineWidth:_0xf49ax5[_0xd087[52]]|| 0,textOpacity:_0xf49ax5[_0xd087[53]]|| 0.9,textWidth:_0xf49ax5[_0xd087[54]]|| 1,outlineOpacity:_0xf49ax5[_0xd087[55]]|| 0.4};var _0xf49ax30=_0xf49ax28[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[53]],palette:[_0xf49ax5[_0xd087[48]]],forceRgbOutput:true});if(_0xf49ax5[_0xd087[54]]> 1){_0xf49ax30[_0xd087[57]](_0xf49ax5[_0xd087[54]])};if(!_0xf49ax5|| (_0xf49ax5&& !_0xf49ax5[_0xd087[52]])){return _0xf49ax30};var _0xf49ax31=_0xf49ax28[_0xd087[57]](_0xf49ax5[_0xd087[52]])[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[55]],palette:[_0xf49ax5[_0xd087[50]]],forceRgbOutput:true});return ee[_0xd087[59]][_0xd087[58]](ee.List([_0xf49ax31,_0xf49ax30]))[_0xd087[47]]()}else {return _0xf49ax28}}}

var showPansharpened = false;

var start = '1999-01-01';
var stop = '2005-01-01';

var LC8_BANDS = ['B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10'];
var LC7_BANDS = ['B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B8', 'B8'];
var LC5_BANDS = ['B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B7', 'B7'];
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp'];



function getEdge(mask) {
  var canny = ee.Algorithms.CannyEdgeDetector(mask, 0.99, 0);
  return canny.mask(canny)
}

function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, azimuth, zenith, weight, height_multiplier) {
  var hsv  = image.unitScale(0, 255).rgbtohsv();

  var terrain = ee.call('Terrain', elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));
  var aspect = radians(terrain.select(['aspect']));
  var hs = hillshade(azimuth, zenith, slope, aspect);

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvtorgb();
}

var pansharpen = function(image) {
    var pan = image.select('pan');
    var rgb = image.select('red', 'green', 'blue');
    var hsv  = rgb.rgbtohsv();
    var huesat = hsv.select('hue', 'saturation');
    var upres = ee.Image.cat(huesat, pan.multiply(2)).hsvtorgb();
 
    return upres;
}

var slope_threshold = 0.3

function getSlopeMask(dem) {
  var slope = radians(ee.call('Terrain', dem).select(['slope']));
  var slopeMask = slope.gt(slope_threshold)
    //.focal_max({radius:90, units: 'meters'}).focal_min({radius:90, units: 'meters'})
  
  return slopeMask;
}

//var demThreshold = 915

var demMin = 1730
var demThreshold = 1751
//var demThreshold = 230
//var demMin = 210

function maskHills(demImage) {
  return demImage.lt(demThreshold)
}

//Map.centerObject(aoi, 12)
var aoi = reservoir_prosser_creek
//var aoi = reservoir_LochDoon

print('Map scale: ' + Map.getScale())

//aoi = ee.Geometry(Map.getBounds(true))
var bounds = aoi.buffer(1000).bounds()

var demMask = dem.gt(demThreshold)
demMask = demMask.mask(demMask)//.clip(bounds)

var coords = ee.List(bounds.coordinates().get(0))
var xmin = ee.Number(ee.List(coords.get(0)).get(0))
var xmax = ee.Number(ee.List(coords.get(1)).get(0))
var ymin = ee.Number(ee.List(coords.get(0)).get(1))
var ymax = ee.Number(ee.List(coords.get(2)).get(1))

var slopeMask = getSlopeMask(dem);

function addDemScaledToBounds(bounds) {
  var azimuth = 90;
  var zenith = 30;
  
  Map.addLayer(dem, {}, 'dem (raw)', false)
  
  // compute min/max dynamically
  var demMinMax = dem.reduceRegion(ee.Reducer.minMax(), bounds, 300).getInfo()
  var dem_min = demMinMax['elevation_min']
  var dem_max = demMinMax['elevation_max']
  print('dem min: ' + dem_min)
  print('dem max: ' + dem_max)
  var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']
  
  var v = dem.visualize({palette:colors_dem, min:dem_min, max:dem_max, opacity: 1.0});
  var demRendered = hillshadeit(v, dem, azimuth, zenith, 1.0, 3.0);
  Map.addLayer(demRendered, {}, 'elevation ' + dem_name);

  var dem2 = ee.Image('USGS/SRTMGL1_003');
  var v2 = dem2.visualize({palette:colors_dem, min:dem_min, max:dem_max, opacity: 1.0});
  var demRendered2 = hillshadeit(v2, dem2, azimuth, zenith, 1.0, 3.0);
  Map.addLayer(demRendered2, {}, 'elevation SRTM', false);


  var s = slopeMask.mask(slopeMask)
  s = s.visualize({opacity:0.7, palette:['000000']})
  Map.addLayer(s, {}, 'slope mask', false)
  
  Map.addLayer(demMask.mask(demMask), {palette:['000000', 'ffffff']}, 'dem mask', false)

  return demRendered;
}

var demVis = addDemScaledToBounds(bounds)

var images = ee.ImageCollection(l8.select(LC8_BANDS, STD_NAMES)
  .merge(l7.select(LC7_BANDS, STD_NAMES))
  .merge(l5.select(LC5_BANDS, STD_NAMES)))

//var images = l8.select(LC8_BANDS, STD_NAMES)

  .filterDate(start, stop)
  .filterBounds(bounds)
  //.sort('system:time_start')


Map.addLayer(images.select(['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan']), {}, 'raw images', false)
Map.addLayer(images.count(), {}, 'raw images (count)', false)

// return // exit

function addRawImagesToMap() {
  // add real images to map
  var count = 10;
  var start = 0
  var list = images.toList(count, start);
  
  for(var i=0; i < count - 1; i++) {
    var image = ee.Image(list.get(i))
    
    Map.addLayer(image, {min:0.03, max:0.35, bands: ['swir1', 'nir', 'green']}, i.toString() + ' false - ' + image.get('LANDSAT_SCENE_ID').getInfo(), i === 0);
  }   
  
  // export real images, no processing
  Export.video(images.map(function(i) { return i.visualize({min:0.03, max:0.35, bands: ['swir1', 'nir', 'green']})}), 'without-processing-sng', {
    scale: 5,
    framesPerSecond: 5,
    region: JSON.stringify(bounds.getInfo()) //region
  });
}

// addRawImagesToMap();

print(bounds)
// return // exit


// smoothen and compute edge for permanent water mask
var permanentWaterMask = glcf.map(function(i) { return i.eq(2) }).sum().gt(0)
                            .focal_mode(35, 'circle', 'meters', 3)
                            
var permanentWaterMaskEdge = ee.Algorithms.CannyEdgeDetector(permanentWaterMask, 0.99)

var fileName = 'reservoir-'

var scale = 15

var I_min = 0.2
var I_max = 0.4
var gamma = 1.0

// A helper to apply an expression and linearly rescale the output.
var rescale = function(img, exp, thresholds) {
  return img.expression(exp, {img: img})
      .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
};

// Compute a cloud score.  This expects the input image to have the common
// band names: ["red", "blue", etc], so it can work across sensors.
var cloudScore = function(img) {
  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  
  // Clouds are reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));

  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.3, 0.8]));

  // Clouds are reasonably bright in all infrared bands.
  score = score.min(rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));

  // Clouds are reasonably cool in temperature.
  score = score.min(rescale(img, 'img.temp', [300, 290]));

  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  
  return score.min(rescale(ndsi, 'img', [0.8, 0.6]));
};

var cloudThreshold = 0.5 // lower - more clouds 

var maskClouds = function(img) { 
  return cloudScore(img).gt(cloudThreshold).rename(['cloud'])
};


function snowScore(img){
      // Compute several indicators of snowyness and take the minimum of them.
      var score = ee.Image(1.0)
      
      // Snow is reasonably bright in the blue band.
      score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));
    
      // Snow is reasonably bright in all visible bands.
      score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));
    
      // Excluded this for snow reasonably bright in all infrared bands.
      score = score.min(rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));
    
      // Snow is reasonably cool in temperature.
      //Changed from [300,290] to [290,275] for AK
      score = score.min(rescale(img, 'img.temp', [300, 273.15])); // start from 0C
      
      // Snow is high in ndsi.
      var ndsi = img.normalizedDifference(['green', 'nir']);
      ndsi = rescale(ndsi, 'img', [0.5, 0.7]);
      score = score.min(ndsi);
      
      return score.clamp(0,1).toFloat()
      }

var snowThresh = 0.5; //Lower number masks more out (0-1)

function maskSnow(img){
  return snowScore(img).gt(snowThresh).rename(['snow'])
  //return img.mask(img.mask().and(ss.lt(snowThresh)))
}

// Dynamic water thresholding, http://www.mdpi.com/2072-4292/8/5/386

// Return the DN that maximizes interclass variance in B5 (in the region).
var otsu = function(histogram) {
  var counts = ee.Array(histogram.get('histogram'));
  var means = ee.Array(histogram.get('bucketMeans'));
  var size = means.length().get([0]);
  var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
  var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
  var mean = sum.divide(total);
  
  var indices = ee.List.sequence(1, size);
  
  // Compute between sum of squares, where each mean partitions the data.
  var bss = indices.map(function(i) {
    var aCounts = counts.slice(0, 0, i);
    var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var aMeans = means.slice(0, 0, i);
    var aMean = aMeans.multiply(aCounts)
        .reduce(ee.Reducer.sum(), [0]).get([0])
        .divide(aCount);
    var bCount = total.subtract(aCount);
    var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
    return aCount.multiply(aMean.subtract(mean).pow(2)).add(
           bCount.multiply(bMean.subtract(mean).pow(2)));
  });
  
  // Return the mean value corresponding to the maximum BSS.
  return means.sort(bss).get([-1]);
};

function maskWaterDynamic(i) {
  // compute NDWI
  var ndwi = i.normalizedDifference(['green', 'nir']);
  //var ndwi = i.normalizedDifference(['green', 'swir1']);
    
  // detect sharp changes in NDWI
  var canny = ee.Algorithms.CannyEdgeDetector(ndwi.clip(bounds), 0.95, 0.5);
  canny = canny.mask(canny).clip(bounds)
  
  // buffer around NDWI edges
  var cannyBuffer = canny.focal_max(ee.Number(scale).multiply(1.5), 'square', 'meters');
  var ndwi_canny = ndwi.mask(cannyBuffer)
  
  // compute threshold using Otsu thresholding
  var hist = ee.Dictionary(ndwi_canny.reduceRegion(ee.Reducer.histogram(255), bounds, scale).get('nd'))
  
  var ndwi_threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0.3);
  
  var ndwi_max = 0.8;
  var ndwi_min = -0.15;
  ndwi_threshold = ee.Number(ndwi_max).min(ee.Number(ndwi_min).max(ndwi_threshold))
  
  // threshold
  var water = ndwi.gt(ndwi_threshold)
    .set('ndwi_threshold', ndwi_threshold)

  return water;
}

function maskWaterStatic(i) {
  var ndwiThreshold = 0.05

//var ndwi = i.normalizedDifference(['green', 'nir']);
  var ndwi = i.normalizedDifference(['green', 'swir1']);
  var water = ndwi.gt(ndwiThreshold);
  
  return water;
}

var maskWater = maskWaterStatic

function vegetationScore(i) {
  var ndvi = i.normalizedDifference(['nir', 'red']).rename('ndvi');
  return rescale(ndvi, 'img.ndvi', [0.3, 0.5])
}

var vegetationThreshold = 0.35
function maskVegetation(i) {
  return vegetationScore(i).lt(vegetationThreshold);
}

// pre-computed cloud-free water masks
/*
var blobMinPixelCount = 50
var cloudfree = ee.FeatureCollection('ft:1TEpTbfTfSfSPOHNj4JG9N5zY7MUjYm7yvGXWK3IV')

var count = 45;

var waterOccurrence = ee.ImageCollection(cloudfree.map(function(f) {
  var image = ee.Image(0).toByte();
  image = image.paint(ee.FeatureCollection(f), 1); // paint fill
  return image;
})).sum().divide(count)

Map.addLayer(waterOccurrence.mask(waterOccurrence.gt(0)), {min:0, max:1, palette:['ffffff', '0000ff']}, 'water occurrence (exported)', false)
*/


function dcs(image, region, scale) {
  var bandNames = image.bandNames();

  // The axes are numbered, so to make the following code more
  // readable, give the axes names.
  var imageAxis = 0;
  var bandAxis = 1;

  // Compute the mean of each band in the region.
  var means = image.reduceRegion(ee.Reducer.mean(), region, scale);

  // Create a constant array image from the mean of each band.
  var meansArray = ee.Image(means.toArray());

  // Collapse the bands of the image into a 1D array per pixel,
  // with images along the first axis and bands along the second.
  var arrays = image.toArray();

  // Perform element-by-element subtraction, which centers the
  // distribution of each band within the region.
  var centered = arrays.subtract(meansArray);

  // Compute the covariance of the bands within the region.
  var covar = centered.reduceRegion({
    reducer: ee.Reducer.centeredCovariance(),
    geometry: region,
    scale: scale
  });

  // Get the 'array' result and cast to an array. Note this is a
  // single array, not one array per pixel, and represents the
  // band-to-band covariance within the region.
  var covarArray = ee.Array(covar.get('array'));

  // Perform an eigen analysis and slice apart the values and vectors.
  var eigens = covarArray.eigen();
  var eigenValues = eigens.slice(bandAxis, 0, 1);
  var eigenVectors = eigens.slice(bandAxis, 1);

  // Rotate by the eigenvectors, scale to a variance of 30, and rotate back.
  var i = ee.Array.identity(bandNames.length());
  var variance = eigenValues.sqrt().matrixToDiag();
  var scaled = i.multiply(30).divide(variance);
  var rotation = eigenVectors.transpose()
    .matrixMultiply(scaled)
    .matrixMultiply(eigenVectors);

  // Reshape the 1-D 'normalized' array, so we can left matrix multiply
  // with the rotation. This requires embedding it in 2-D space and
  // transposing.
  var transposed = centered.arrayRepeat(bandAxis, 1).arrayTranspose();

  // Convert rotated results to 3 RGB bands, and shift the mean to 127.
  return transposed.matrixMultiply(ee.Image(rotation))
    .arrayProject([bandAxis])
    .arrayFlatten([bandNames])
    .add(127).byte();
}

function detectSurfaceWater(i){
  // default mask is incomplete
  var mask = ee.ImageCollection(i.bandNames().map(function(b) { return i.select([b]).mask().rename('mask') })).product()
  i = i.mask(mask)
  
  var image = i.select('swir1', 'nir', 'green');
  var imageVis = image.visualize({min:0.03, max:0.35})
    //.mask(0.6)

/*
  var rgb = i.select('red', 'green', 'blue', 'pan');
  var image = pansharpen(rgb);
  var imageVis = image.visualize({gamma:gamma, min:0.15, max:[0.5, 0.5, 0.6]})
*/

/*
  var snow = snowScore(i) // maskSnow(i);
  var clouds = cloudScore(i) //  maskClouds(i).and(snow.not());
  var vegetation = vegetationScore(i) // maskVegetation(i);
*/  
  // TODO: switch from discrete value to probability
  var snow = maskSnow(i);
  var clouds = maskClouds(i).and(snow.not());
  var vegetation = maskVegetation(i);

  var hills = maskHills(dem)
  var slopes = slopeMask.not()

  var sceneEdge = getEdge(mask.not())
  var sceneEdgeVis = sceneEdge.visualize({palette:['FFFF00'], opacity:0.9, forceRgbOutput: true});

  // var water = maskWater(i)
  var water = maskWater(i)
    .mask(vegetation.or(hills).or(slopes).or(clouds).or(snow)
      .and(dem.lt(demThreshold)))
      //.and(permanentWaterMask.focal_max(1000, 'circle', 'meters').multiply(dem.lt(demThreshold))))

  water = water//.mask(water.mask(waterOccurrence.gt(0).focal_max({radius:90, units:'meters'})))
    //.connectedPixelCount(blobMinPixelCount, false)
    //.eq(blobMinPixelCount)

    .clip(bounds)
    
  water = water.updateMask(water)      

  // show water as original image, RGB, stretched
  if(!showPansharpened) {
    var waterVis = i.select(['red', 'green', 'blue'])
      .mask(water).visualize({gamma:gamma, min:0.03, max:[0.4, 0.4, 0.5]});
  } else {
    var waterVis = pansharpen(i.select(['red', 'green', 'blue', 'pan']))
      .mask(water).visualize({gamma:gamma, min:0.03, max:[0.4, 0.4, 0.5]})
  }
  var waterVis = water.visualize({palette:['0083ee'], forceRgbOutput: true}).mask(0.1)

  var waterEdge = getEdge(water.mask())

  var waterEdgeVis = waterEdge
    .visualize({palette:['0000ff'], opacity:0.8, forceRgbOutput: true})

  // edge between water and land
  var waterLandEdge = waterEdge.mask()
    .and(sceneEdge.mask().focal_max({radius:30, units:'meters'}).not()) // not near scene edge
    .and(clouds.focal_max({radius:150, units:'meters'}).not()) // not near/within clouds
    
  var waterLandEdgeVis = waterLandEdge.mask(waterLandEdge)
    .visualize({palette:['40ee40'/*'0147fa'*/], opacity:1.0, forceRgbOutput: true})
    
  var snowEdge = getEdge(snow);

  // number of snow pixels overlapping with water
  var snowWaterPixelCount = ee.Dictionary(snow.focal_max({radius:60, units:'meters'}).and(water)
    .reduceRegion({reducer: ee.Reducer.sum(), geometry: aoi, scale: 30, maxPixels:1e9})).get('snow')

  // number of cloud pixels overlapping with water
  var cloudWaterPixelCount = ee.Dictionary(clouds.focal_max({radius:60, units:'meters'}).and(water)
    .reduceRegion({reducer: ee.Reducer.sum(), geometry: aoi, scale: 30, maxPixels:1e9})).get('cloud')

  var snowVis = snow.mask(snow).visualize({palette:['00FFFF'], opacity:0.6, forceRgbOutput: true});
  var snowEdgeVis = snowEdge.visualize({palette:['00FFFF'], opacity:0.9, forceRgbOutput: true});
  
  var cloudsVis = clouds.mask(clouds.multiply(cloudScore(i)))
    .visualize({palette: ['FFFFFF', 'FF0000'], opacity:0.5})

  var cloudsEdgeVis = getEdge(clouds)
      .visualize({palette: ['FF0000'], opacity:0.8})

  var vegetationEdgeVis = getEdge(vegetation)
      .visualize({palette: ['00FF00'], opacity:0.8})

  var hillsEdgeVis = getEdge(hills)
      .visualize({palette: ['000000'], opacity:0.8})
      
  // compute scalars
  var waterAtSceneEdge = waterEdge.and(sceneEdge).reduceRegion(ee.Reducer.sum(), bounds, 30).get('nd')
  
  var waterArea = ee.Number(ee.Image.pixelArea().mask(water).reduceRegion(ee.Reducer.sum(), bounds, 30).get('area')).round()

/*    // text
  var strDate = ee.Date(i.get('system:time_start')).format('YYYY-MM-dd')
  var str = ee.String('Date: ').cat(strDate)
  var textDate = Text.draw(str, pt_date, scale, {fontSize:16, textColor:'black'})

  var str = ee.String('Cloud: ').cat(ee.String(cloudWaterPixelCount))
  var textCloud = Text.draw(str, pt_cloud, scale, {fontSize:16, textColor:'black'})

  var str = ee.String('Snow: ').cat(ee.String(snowWaterPixelCount))
  var textSnow = Text.draw(str, pt_snow, scale, {fontSize:16, textColor:'black'})

  var str = ee.String('Area: ').cat(ee.String(ee.String(waterArea)))
  var textArea = Text.draw(str, pt_area, scale, {fontSize:16, textColor:'black'})

  var str = ee.String('NDWI: ').cat(ee.String(ee.String(water.get('ndwi_threshold'))))
  var textNdwi = Text.draw(str, pt_ndwi, scale, {fontSize:16, textColor:'black'})
*/

  image = ee.ImageCollection.fromImages([
    imageVis,
    //vegetationEdgeVis,
    //hillsEdgeVis,
    //snowVis,
    //snowEdgeVis,
    //cloudsVis,
    //cloudsEdgeVis,
    waterVis,
    //waterEdgeVis,
    waterLandEdgeVis,
    sceneEdgeVis,

/*
    textDate,
    textArea,
    textSnow,
    textCloud,
    textNdwi
*/
  ]).mosaic()

  return image
    .set('id', i.get('LANDSAT_SCENE_ID'))
    .set('date', i.get('DATE_ACQUIRED'))
    .set('cloud_pixels', cloudWaterPixelCount)
    .set('snow_pixels', snowWaterPixelCount)
    .set('water_area', waterArea)
    //.set('water_at_edge', waterAtSceneEdge)
    .set('ndwi_threshold', water.get('ndwi_threshold'))
    //.clip(bounds)
    .addBands(water.rename('water'))
    .addBands(mask.gt(0))
    .addBands(waterLandEdge.rename('water_land_edge'))
    //.addBands(i)
}

//var water = detectSurfaceWater(ee.Image(images.first()));
//Map.addLayer(water);
// return // exit


function debug(images, index) {
  if(typeof(index) === 'string') {
    var i = ee.Image(images.filter(ee.Filter.eq('LANDSAT_SCENE_ID', index)).first())
  } else {
    var i = ee.Image(images.toList(1, index).get(0))  
  }
  
  Map.addLayer(i, {min:0.03, max:0.35, bands: ['swir1', 'nir', 'green']}, index.toString() + ' raw', false);

  // detect water using 2 methods (bad design :()
  var maskWaterOld = maskWater 

  maskWater = maskWaterStatic
  var result = detectSurfaceWater(i)
  print(result)
  Map.addLayer(detectSurfaceWater(i), {}, index.toString() + ' water (static)', false)

  maskWater = maskWaterDynamic
  var result = detectSurfaceWater(i)
  print(result)
  Map.addLayer(detectSurfaceWater(i), {}, index.toString() + ' water (dynamic)', false)
  
  maskWater = maskWaterOld
  
  var snow = snowScore(i);
  Map.addLayer(snow.mask(snow), {palette:['000000', 'FFFF00'], min:0, max:1}, index.toString() + ' snow score', false);

  var clouds = cloudScore(i);
  Map.addLayer(clouds.mask(clouds), {palette:['000000', 'FF0000'], min:0, max:1}, index.toString() + ' cloud score', false);

  var vegetation = vegetationScore(i);
  Map.addLayer(vegetation.mask(vegetation), {palette:['000000', '00FF00'], min:0, max:1}, index.toString() + ' vegetation score', false);

  var combined = vegetationScore(i).max(snowScore(i)).max(cloudScore(i));
  Map.addLayer(combined.mask(combined), {palette:['000000', 'FFFFFF'], min:0, max:1}, index.toString() + ' combined noise score', false);

  // combine masks
  var mask = ee.ImageCollection(i.bandNames().map(function(b) { return i.select([b]).mask().rename('mask') })).product()
  
  Map.addLayer(mask.mask(mask), {}, 'mask', false)

  var hills = maskHills(dem)
  var slopes = slopeMask.not()


  // Decorrelation Stretch
  /*
  var region = ee.Geometry(Map.getBounds(true))
  Map.addLayer(dcs(i, region, 1000).select(['swir1', 'nir', 'green']), {}, index.toString() + ' DCS', false);
  */
}

function showDebug(images) {
  debug(images, 0);
  debug(images, 1);
  //debug(images, 2);
  //debug(images, 'LE70430332000216EDC00')
  //debug(images, 'LT50430331985326PAC00')
  //debug(images, 'LE70430332012169EDC00')
  //debug(images, 'LE72050222001105NSG00')
}

//showDebug(images)
//return // exit

var imagesProcessed = images.map(detectSurfaceWater);

// filter images with clouds over area
print('All:', imagesProcessed.aggregate_count('date')); 
 
imagesProcessed = imagesProcessed
  //.filterMetadata('water_at_edge', 'greater_than', 20)
  //.filterMetadata('water_at_edge', 'less_than', 100)
  //.filterMetadata('snow_pixels', 'less_than', 100) // snow pixels detected as water
  //.filterMetadata('cloud_pixels', 'less_than', 100) // cloud pixels detected as water
  //.filterMetadata('water_area', 'greater_than', 100)

  .filterMetadata('snow_pixels', 'less_than', 100) // snow pixels detected as water
  .filterMetadata('cloud_pixels', 'less_than', 100) // cloud pixels detected as water
  .filterMetadata('water_area', 'greater_than', 10000) // at least some water

  //.sort('water_area')
  //.sort('system:time_start')

showDebug(imagesProcessed)
//return // exit
  
//collection = collection.filterMetadata('snow_pixels', 'greater_than', 10)
//print('With snow:', imagesProcessed.aggregate_count('cloud_pixels')); 

// select only images where water intersets with the edge
//imagesProcessed = imagesProcessed.filterMetadata('water_at_edge', 'greater_than', 0)

// select only with clouds
//imagesProcessed = imagesProcessed.filterMetadata('cloud_pixels', 'greater_than', 10);

print('Filered:', imagesProcessed.aggregate_count('date')); 

// prepare polygons
var waterPolygons = imagesProcessed.map(function(i){
  var g = ee.FeatureCollection(i.select('water')
        .reduceToVectors({scale: 30, geometry: bounds}))
        .geometry();
        
  var waterPolygon = ee.Feature(g)
    .set('id', i.get('id'))
    .set('date', i.get('date'))
    .set('water_area_geom', g.area(1))
    .set('water_area', i.get('water_area'))
    .set('water_at_edge', i.get('water_at_edge'))
    .set('cloud_pixels', i.get('cloud_pixels'))
    .set('snow_pixels', i.get('snow_pixels'))
    .set('ndwi_threshold', i.get('ndwi_threshold'))

  return waterPolygon;
})

Export.table(waterPolygons, 'reservoir_water_polygons', {fileFormat:'KML'})

// also get image mask polygons
var maskPolygons = imagesProcessed.map(function(i){
  var g = ee.FeatureCollection(i.select('mask')
        .reduceToVectors({scale: 30, geometry: bounds})
          //.filter(ee.Filter.gt('count', 300))
          )
        .geometry();

  var mask = ee.Feature(g)
    .set('id', i.get('id'))
    .set('date', i.get('date'))
    .set('water_area_geom', g.area(1))
    .set('water_area', i.get('water_area'))
    .set('water_at_edge', i.get('water_at_edge'))
    .set('cloud_pixels', i.get('cloud_pixels'))
    .set('snow_pixels', i.get('snow_pixels'))
    .set('ndwi_threshold', i.get('ndwi_threshold'))

  return mask;
})

Export.table(maskPolygons, 'reservoir_water_mask_polygons', {fileFormat:'KML'})

var wateLandEdgePolygons = imagesProcessed.map(function(i){
  var g = ee.FeatureCollection(i.select('water_land_edge')
        .reduceToVectors({scale: 30, geometry: bounds})
          .filter(ee.Filter.eq('label', 1))
          )
        .geometry();

  var mask = ee.Feature(g)
    .set('id', i.get('id'))
    .set('date', i.get('date'))
    .set('water_area_geom', g.area(1))
    .set('water_area', i.get('water_area'))
    .set('water_at_edge', i.get('water_at_edge'))
    .set('cloud_pixels', i.get('cloud_pixels'))
    .set('snow_pixels', i.get('snow_pixels'))
    .set('ndwi_threshold', i.get('ndwi_threshold'))

  return mask;
})

Export.table(wateLandEdgePolygons, 'reservoir_land_water_edge', {fileFormat:'KML'})


var f0 = ee.Feature(ee.List(wateLandEdgePolygons.toList(1,0)).get(0))
Map.addLayer(f0, {color:'0000ff'}, 'e0', false)
print(f0)

var f0 = ee.Feature(ee.List(waterPolygons.toList(5,0)).get(4))
Map.addLayer(f0, {color:'0000ff'}, 'f0', false)
print(f0)



// add results as layers
var start = 0
var count = 10
var list = imagesProcessed.toList(count, start);

for(var i=0; i < count - 1; i++) {
  var image = ee.Image(list.get(i)).clip(bounds)
  
  Map.addLayer(image.clip(bounds), {}, i.toString(), i === 0);
}   

var coords = ee.List(bounds.bounds(1, ee.Projection('EPSG:3857')).coordinates().get(0)).getInfo()
var w = Math.round((coords[1][0] - coords[0][0])/scale)
var h = Math.round((coords[2][1] - coords[1][1])/scale)
print(w + 'x' + h)

// export video without clouds
Export.video(imagesProcessed.select([0,1,2]), fileName, {
  dimensions: w + 'x' + h,
  framesPerSecond: 5,
  region: JSON.stringify(bounds.getInfo()) //region
});
  


function computeWaterOccurrence() {
  // compute water occurrence using only clear images

  var imagesProcessedForWaterOccurrence = imagesProcessed
    .filterMetadata('snow_pixels', 'less_than', 100) // snow pixels detected as water
    .filterMetadata('cloud_pixels', 'less_than', 100) // cloud pixels detected as water
    .filterMetadata('water_area', 'greater_than', 1000) // at least some water

    // .filterMetadata('water_at_edge', 'equals', 0) // no water at edge
  
  print('Used for water occurrence:', imagesProcessedForWaterOccurrence.aggregate_count('date')); 
  
  print(imagesProcessedForWaterOccurrence.first())
  
  var waterOccurrence = imagesProcessedForWaterOccurrence
    .select('water')
    .sum().divide(imagesProcessedForWaterOccurrence.select('mask').sum())
    
  // waterOccurrence = waterOccurrence.divide(0.88).clamp(0, 1)
  
    //.mask(demMask.not())
    
  
  var waterOccurrenceSld = '\
  <RasterSymbolizer>\
    <ColorMap  type="intervals" extended="false" >\
      <ColorMapEntry color="#00ff00" quantity="0.0" label="0.0"/>\
      <ColorMapEntry color="#f7fbff" quantity="0.1" label="0.1"/>\
      <ColorMapEntry color="#deebf7" quantity="0.2" label="0.2" />\
      <ColorMapEntry color="#c6dbef" quantity="0.3" label="0.3" />\
      <ColorMapEntry color="#9ecae1" quantity="0.4" label="0.4" />\
      <ColorMapEntry color="#6baed6" quantity="0.5" label="0.5" />\
      <ColorMapEntry color="#4292c6" quantity="0.6" label="0.6" />\
      <ColorMapEntry color="#2171b5" quantity="0.7" label="0.7" />\
      <ColorMapEntry color="#08519c" quantity="0.8" label="0.8" />\
      <ColorMapEntry color="#08306b" quantity="0.9" label="0.9" />\
      <ColorMapEntry color="#000050" quantity="1.0" label="1" />\
    </ColorMap>\
  </RasterSymbolizer>';
  
  var waterOccurrenceVis = waterOccurrence.sldStyle(waterOccurrenceSld).visualize({})
    .mask(rescale(waterOccurrence, 'img.water', [0, 0.3]))
    
  Map.addLayer(waterOccurrenceVis, {}, 'water occurrence', true)
  Map.addLayer(waterOccurrence, {}, 'water occurrence (raw)', false)
  
  Export.image.toDrive({
    image: waterOccurrence, description:'water-occurrence', fileNamePrefix: 'water-occurrence', 
    region: bounds, scale: scale
  })

}

computeWaterOccurrence()

/*
// bootstrap
function getCollectionWithWaterOccurrence(ic) {
  return ic
  .map(function(i){ return ee.ImageCollection.fromImages([
      demVis.visualize({forceRgbOutput: true}),
      waterOccurrenceCorrectedVis.visualize({opacity: 0.8, forceRgbOutput: true}),
      i.visualize({opacity: 0.8, forceRgbOutput: true})
      .set('id', i.get('id'))
    ]).mosaic()});
}

// get with water occurrence and dem
collection = getCollectionWithWaterOccurrence(collection);

list = collection.toList(count, start);
for(var i=0; i < count - 1; i++) {
  var image = ee.Image(list.get(i)).clip(bounds)
  Map.addLayer(image.clip(bounds), {}, i.toString() + ' - WO ' + image.get('id').getInfo(), i === 0);
}  

Export.video(collection.select([0,1,2]), fileName + '-with-occurrence', {
  dimensions: w + 'x' + h,
  framesPerSecond: 5,
  region: JSON.stringify(bounds.getInfo()) //region
});
*/

Map.addLayer(demMask, {opacity:0.7, palette:['000000']}, 'dem > ' + demThreshold, false);


// add permanent watermask
Map.addLayer(permanentWaterMask.mask(permanentWaterMask), {palette: ['0000aa'], opacity: 0.5}, 'permanent mask water (GLCF)', false)
Map.addLayer(permanentWaterMaskEdge.mask(permanentWaterMaskEdge), {palette: ['ffffff']}, 'permanent water mask edge (GLCF)')

// sample DEM at water boundary
// print(ui.Chart.image.histogram(dem.mask(permanentWaterMaskEdge), bounds, 30, 100))

var dem2 = dem
  //.convolve(ee.Kernel.gaussian(90, 60, 'meters'))
var addIso = function(level, color) {
  var crossing = dem2.subtract(level).zeroCrossing();
  var exact = dem2.eq(level);
  Map.addLayer(dem2.mask(crossing.or(exact)), {min: 0, max: 1, palette: color}, level + 'm', false);
};

var colors = ['ffffcc', 'ffeda0', 'fed976', 'feb24c', 'fd8d3c', 'fc4e2a', 'e31a1c', 'bd0026', '800026'];
var levels = ee.List.sequence(demMin, demThreshold, 4).getInfo();

for(var i = 0; i < levels.length; i++) {
  addIso(levels[i], colors[i]);
}

