/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var L8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT_TOA"),
    S2 = ee.ImageCollection("COPERNICUS/S2"),
    aoi = /* color: #d63000 */ee.Geometry.Polygon(
        [[[5.330887293028127, 53.44882341910015],
          [5.099619088645568, 53.48468889984111],
          [4.96093774405108, 53.279395385284396],
          [5.197795176859472, 53.23989036979411]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Depth Invariance Image (Based on Chamini Mirandu, 2017, code: Gerben Hagenaars Deltares)

// var aoi = Map.getBounds(true);
var aoi = aoi;

// Select cloud free image
var col = L8

col = col.filterBounds(aoi).filterDate('2014-01-01','2017-09-01')
col = col.sort('CLOUD_COVER') // Landsat
col = col.sort('CLOUDY_PIXEL_PERCENTAGE') // Sentinel

var image = ee.Image(col.first())
// image = image.divide(10000);

image = image.select(['B1','B2','B3','B4','B5'],['aerosol','B','G','R','NIR']) // L8
// image = image.select(['B1','B2','B3','B4','B8'],['aerosol','B','G','R','NIR']) // S2

// Calculate NDWI and mask Land
var ndwi = image.normalizedDifference(['NIR','G']) // NIR and Green band
image = image.mask(ndwi.lte(0)) // easy land-water mask
Map.addLayer(image.select('R','G','B'),{min:0,max:0.3},'Masked Land image')

// Calculate statistics of bands (select bands based on difference in bottom refelctances and water penetration)
// For L8 OLI use B1, B2 and B4 (NIR)
var imgSTD = image.reduceRegion({reducer:ee.Reducer.stdDev(),geometry:aoi,maxPixels:3e9}).toArray()
var imgVAR = imgSTD.multiply(imgSTD).toList();
var imgMEAN = image.reduceRegion({reducer:ee.Reducer.mean(),geometry:aoi,maxPixels:3e9}).toArray();
var CV = imgSTD.divide(imgMEAN);

// Covariance Matrix for band pairs
var imgCOV = ee.Dictionary(image.subtract(imgMEAN).reduceRegion(ee.Reducer.centeredCovariance(),aoi)) // assumes mean centered image
var imgCOVB12 =  ee.Array(imgCOV.get('aerosol')).get([0,1]);
var imgCOVB13 =  ee.Array(imgCOV.get('aerosol')).get([0,2]);
var imgCOVB23 =  ee.Array(imgCOV.get('R')).get([0,2]);

// Attenuation Coefficient (a) of band pairs
var a1_2 = ee.Number(imgVAR.get(0)).subtract(imgVAR.get(1))
var a1_3 = ee.Number(imgVAR.get(0)).subtract(imgVAR.get(2))
var a2_3 = ee.Number(imgVAR.get(1)).subtract(imgVAR.get(2))

// Ratio of Attenuation Coefficient
var k1_2 = a1_2.add(((a1_2.multiply(a1_2).add(1))).pow(0.5))
var k1_3 = a1_3.add(((a1_3.multiply(a1_3).add(1))).pow(0.5))
var k2_3 = a2_3.add(((a2_3.multiply(a2_3).add(1))).pow(0.5))

// Depth invariance index DII
var DII_1_2 = image.select('aerosol').log().subtract(image.select('B').log().multiply(k2_3))
var DII_1_3 = image.select('aerosol').log().subtract(image.select('R').log().multiply(k2_3))
var DII_2_3 = image.select('B').log().subtract(image.select('R').log().multiply(k2_3))

// Make depth invariance image
var DI_image = ee.Image();
DI_image = DI_image.addBands(DII_1_2.select(['aerosol'],['DII_1_2']));
DI_image = DI_image.addBands(DII_1_3.select(['aerosol'],['DII_1_3']));
DI_image = DI_image.addBands(DII_2_3.select(['B'],['DII_2_3']));
DI_image = DI_image.select('DII_1_2','DII_1_3','DII_2_3');

DI_image = DI_image.resample('bicubic');

Map.addLayer(DI_image,{min:-0.3,max:1.2},'Depth Invariance Image');