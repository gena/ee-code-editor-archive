/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l = /* color: #d63000 */ee.Geometry.LineString(
        [[-115.52473294168789, 48.665169039489115],
         [-115.08183936908637, 48.75385240094623],
         [-114.86109445694206, 48.780444939194645],
         [-114.64577863813201, 48.76861216438613]]),
    dem = ee.Image("USGS/SRTMGL1_003"),
    ned = ee.Image("USGS/NED");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var utils = require('users/gena/packages:utils')

var segmentCount = 100;
var points = utils.lineToPoints(l, segmentCount);

var samples = dem.reduceRegions(points, ee.Reducer.first())
print(Chart.feature.byFeature(samples, 'offset', 'first').setOptions({vAxis: {title:'SRTM'}}))
Map.addLayer(dem, {min:0, max: 2000}, 'SRTM')

var samples = ned.reduceRegions(points, ee.Reducer.first())
print(Chart.feature.byFeature(samples, 'offset', 'first').setOptions({vAxis: {title:'NED'}})) 
Map.addLayer(ned, {min:0, max: 2000}, 'NED')

var diff = ned.subtract(dem);

var samples = diff.reduceRegions(points, ee.Reducer.first())
print(Chart.feature.byFeature(samples, 'offset', 'first').setOptions({vAxis: {title:'NED-SRTM'}}))
Map.addLayer(diff, {min: -50, max: 50, palette: ['ff0000', 'ffffff', 'ff0000']}, 'error', false)

Map.addLayer(points, {}, 'points')

Map.centerObject(l)