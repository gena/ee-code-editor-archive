/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var ahn = ee.Image("AHN/AHN2_05M_RUW"),
    ned = ee.Image("USGS/NED"),
    alos = ee.Image("JAXA/ALOS/AW3D30_V1_1"),
    etopo = ee.Image("NOAA/NGDC/ETOPO1");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var utils = require('users/gena/packages:utils')
var style = require('users/gena/packages:style')

var ex = 10, w = 2.5
//var ex = 1000, w = 5

//var dem = etopo.select('bedrock').resample('bilinear'), min = -1, max = 4000, clipSea = true;
var dem = alos.select('MED').resample('bilinear'), min = -1, max = 4000, clipSea = true;
//var dem = ahn, min = -5, max = 15, clipSea = false;

function show(palette, name, show) {
  if(clipSea) {
    dem = dem.updateMask(dem.gt(0))
  }
  var rgb = utils.hillshadeRGB(dem.visualize({min: min, max: max, palette: palette}), dem, w, ex, 315-180, 5, false)
  

  Map.addLayer(rgb, {}, name, show)
}

show(['1D190E',  '3C3325', 'A5AEB5', '6C6A59', '575140'], 'brown', false)
show(['201A14', '4C423A', 'CBC6BF', '6F665A', '5B5449'], 'brown (darker)', false)
show(['A0142C', '9C142C', '7B142C', '3C142C', '5C142C'], 'red (rose)', false)
show(['5E2E15', 'C3662D', 'F7EADE', '1C0F08', '8B4E2D'], 'orange', false)
show(['a81c1c', 'b21e1e', 'bf1c1c', 'd92323', 'f22525'], 'blood red', false) // bloody red
show(['353535', 'BD0A0D', 'EA2100', 'EA5849', 'A01A1F', '212121'].reverse(), 'red + dark')
 

// Map.setOptions('SATELLITE')
style.SetMapStyleDark()