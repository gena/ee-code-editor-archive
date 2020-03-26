/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var srtm = ee.Image("USGS/SRTMGL1_003"),
    alos = ee.Image("JAXA/ALOS/AW3D30_V1_1"),
    geometry = /* color: #d63000 */ee.Geometry.LineString(
        [[-44.12024935070417, -20.119245356313943],
         [-44.12249701891312, -20.12056001573733]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
alos = alos.select('MED')
 
Map.addLayer(ee.Terrain.hillshade(alos.resample('bicubic'), 45, 25).resample('bicubic'), {}, 'ALOS')
Map.addLayer(ee.Terrain.hillshade(srtm.resample('bicubic'), 45, 25).resample('bicubic'), {}, 'SRTM')

var utils = require('users/gena/packages:utils')

var profile = utils.reduceImageProfile(alos, geometry, ee.Reducer.mean(), Map.getScale())
print(ui.Chart.feature.byFeature(profile, 'distance').setOptions({ title: 'ALOS'}))

var profile = utils.reduceImageProfile(srtm, geometry, ee.Reducer.mean(), Map.getScale())
print(ui.Chart.feature.byFeature(profile, 'distance').setOptions({ title: 'SRTM'}))