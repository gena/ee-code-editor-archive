/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var spectSamples = /* color: d63000 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-54.65620994567871, -11.565823182835729]),
            {
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.4459917545318, -11.272040754703095]),
            {
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.44029211997986, -11.152708498821646]),
            {
              "system:index": "2"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.94188666343689, -10.670972193557132]),
            {
              "system:index": "3"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.94159698486328, -10.672880524769498]),
            {
              "system:index": "4"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.32036781311035, -11.110442642201738]),
            {
              "system:index": "5"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.63434457778931, -12.271552215263215]),
            {
              "system:index": "6"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.5982232093811, -12.192157737116037]),
            {
              "system:index": "7"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.94320631027222, -11.26700073071401]),
            {
              "system:index": "8"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.727020263671875, -11.37446345885943]),
            {
              "system:index": "9"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.473841190338135, -11.485912537197127]),
            {
              "system:index": "10"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.18675899505615, -11.559721488267837]),
            {
              "system:index": "11"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.18733835220337, -11.559742510699557]),
            {
              "system:index": "12"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.18762803077698, -11.557829462953151]),
            {
              "system:index": "13"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.1875958442688, -11.558386560623102]),
            {
              "system:index": "14"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.1856324672699, -11.558912123447179]),
            {
              "system:index": "15"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.1875958442688, -11.558607297129308]),
            {
              "system:index": "16"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.18731689453125, -11.559973757344318]),
            {
              "system:index": "17"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/

/*
script1: where I've coleted the samples.
https://ee-api.appspot.com/751a3d4382f5ce41406c8be769c0225
*/
var bands = ['B2','B3','B4','B5','B6','B7'];

var imageTOAL8 = ee.Image('LC8_L1T_TOA/LC82260682015203LGN00')
                   .select(bands)
                   .multiply(10000.0);

// Atmospher samples
var atm = [805.6, 458.1, 286.8, 168.3, 46.8, 26.6];

var atm = [735, 444, 262, 48, 43, 20];        

print(imageTOAL8.reduceRegion({reducer: ee.Reducer.minMax(), geometry: Map.getBounds(true), scale: 30, maxPixels: 1e9}))

// DOS applied
var b2 = imageTOAL8.select('B2').subtract(atm[0]).max(0);
var b3 = imageTOAL8.select('B3').subtract(atm[1]).max(0);
var b4 = imageTOAL8.select('B4').subtract(atm[2]).max(0);
var b5 = imageTOAL8.select('B5').subtract(atm[3]).max(0);
var b6 = imageTOAL8.select('B6').subtract(atm[4]).max(0);
var b7 = imageTOAL8.select('B7').subtract(atm[5]).max(0);

var imageDOSL8 = b2.addBands(b3).addBands(b4).addBands(b5).addBands(b6).addBands(b7);
print(imageDOSL8);

// Define a list of Landsat 8 wavelengths for X-axis labels.
var wavelengths = [0.48, 0.56, 0.65, 0.86, 1.61, 2.2];

print(Chart.image.regions(imageDOSL8, spectSamples, ee.Reducer.mean(), null, null, wavelengths));

var vis = {'bands':['B6','B5','B4'], 'gain':[0.08,0.06,0.2]};
Map.addLayer(imageTOAL8, vis, 'TOA Collection', true);
Map.addLayer(imageDOSL8, vis, 'DOS Collection', true);
Map.centerObject(imageTOAL8, 12);
