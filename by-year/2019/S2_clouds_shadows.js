/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([-110.7421875, 40.58058466412762]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//CloudScore originally written by Matt Hancher and adapted for S2 data by Ian Housman
//User Params
var startDate = ee.Date.fromYMD(2016,6,1);
var endDate = ee.Date.fromYMD(2016,9,1);
var cloudThresh = 20;//Ranges from 1-100.Lower value will mask more pixels out. Generally 10-30 works well with 20 being used most commonly 
var cloudHeights = ee.List.sequence(200,10000,500);//Height of clouds to use to project cloud shadows
var irSumThresh = 0.35;//Sum of IR bands to include as shadows within TDOM and the shadow shift method (lower number masks out less)
var dilatePixels = 5; //Pixels to dilate around clouds
var contractPixels = 1;//Pixels to reduce cloud mask and dark shadows by to reduce inclusion of single-pixel comission errors


var vizParams = {'min': 0.05,'max': [0.3,0.6,0.35],   'bands':'swir1,nir,red'};
//////////////////////////////////////////////////////////////////////////
var rescale = function(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };
  
////////////////////////////////////////
////////////////////////////////////////
// Cloud masking algorithm for Sentinel2
//Built on ideas from Landsat cloudScore algorithm
//Currently in beta and may need tweaking for individual study areas
function sentinelCloudScore(img) {
  

  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1);
  
  // Clouds are reasonably bright in the blue and cirrus bands.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.5]));
  score = score.min(rescale(img, 'img.cb', [0.1, 0.3]));
  score = score.min(rescale(img, 'img.cb + img.cirrus', [0.15, 0.2]));
  
  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));

  
  //Clouds are moist
  var ndmi = img.normalizedDifference(['nir','swir1']);
  score=score.min(rescale(ndmi, 'img', [-0.1, 0.1]));
  
  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  score=score.min(rescale(ndsi, 'img', [0.8, 0.6]));
  
  score = score.multiply(100).byte();
 
  return img.addBands(score.rename('cloudScore'));
}
//////////////////////////////////////////////////////////////////////////
// Function to mask clouds using the Sentinel-2 QA band.
function maskS2clouds(image) {
  var qa = image.select('QA60').int16();
  
  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = Math.pow(2, 10);
  var cirrusBitMask = Math.pow(2, 11);
  
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(
             qa.bitwiseAnd(cirrusBitMask).eq(0));

  // Return the masked and scaled data.
  return image.updateMask(mask);
}
//////////////////////////////////////////////////////
/////////////////////////////////////////////
/***
 * Implementation of Basic cloud shadow shift
 * 
 * Author: Gennadii Donchyts
 * License: Apache 2.0
 */
function projectShadows(cloudMask,image,cloudHeights){
  var meanAzimuth = image.get('MEAN_SOLAR_AZIMUTH_ANGLE');
  var meanZenith = image.get('MEAN_SOLAR_ZENITH_ANGLE');
  ///////////////////////////////////////////////////////
  
  
  //Find dark pixels
  var darkPixels = image.select(['nir','swir1','swir2']).reduce(ee.Reducer.sum()).lt(irSumThresh)
    .focal_min(contractPixels).focal_max(dilatePixels)
  ;//.gte(1);
    
  
  //Get scale of image
  var nominalScale = cloudMask.projection().nominalScale();

  //Find where cloud shadows should be based on solar geometry
  //Convert to radians
  var azR =ee.Number(meanAzimuth).multiply(Math.PI).divide(180.0).add(ee.Number(0.5).multiply(Math.PI ));
  var zenR  =ee.Number(0.5).multiply(Math.PI ).subtract(ee.Number(meanZenith).multiply(Math.PI).divide(180.0));
  
  //Find the shadows
  var shadows = cloudHeights.map(function(cloudHeight){
    cloudHeight = ee.Number(cloudHeight);
    
    var shadowCastedDistance = zenR.tan().multiply(cloudHeight);//Distance shadow is cast
    var x = azR.cos().multiply(shadowCastedDistance).divide(nominalScale).round();//X distance of shadow
    var y = azR.sin().multiply(shadowCastedDistance).divide(nominalScale).round();//Y distance of shadow
    return cloudMask.changeProj(cloudMask.projection(), cloudMask.projection().translate(x, y));
  });

  var shadowMask = ee.ImageCollection.fromImages(shadows).max();
 
  //Create shadow mask
  shadowMask = shadowMask.and(cloudMask.not());
  shadowMask = shadowMask.and(darkPixels);
  
  var cloudShadowMask = shadowMask.or(cloudMask);
  
  image = image.updateMask(cloudShadowMask.not()).addBands(shadowMask.rename(['cloudShadowMask']));
  return image;
}

//////////////////////////////////////////////////////
//Get some s2 data
var s2s = ee.ImageCollection('COPERNICUS/S2')
                  .filterDate(startDate,endDate)
                  .filterBounds(geometry)
                  .map(function(img){
                    
                    var t = img.select([ 'B1','B2','B3','B4','B5','B6','B7','B8','B8A', 'B9','B10', 'B11','B12']).divide(10000);//Rescale to 0-1
                    t = t.addBands(img.select(['QA60']));
                    var out = t.copyProperties(img).copyProperties(img,['system:time_start']);
                  return out;
                    })
                    .select(['QA60', 'B1','B2','B3','B4','B5','B6','B7','B8','B8A', 'B9','B10', 'B11','B12'],['QA60','cb', 'blue', 'green', 'red', 're1','re2','re3','nir', 'nir2', 'waterVapor', 'cirrus','swir1', 'swir2']);
/////////////////////////////////////////////////////                  
var s2 = ee.Image(s2s.first());
Map.addLayer(s2,vizParams,'Before Masking',false);

s2 = sentinelCloudScore(s2);
var cloudScore = s2.select('cloudScore');
Map.addLayer(cloudScore,{'min':0,'max':100},'CloudScore',false);

var s2CloudMask = cloudScore.gt(cloudThresh)
  .focal_min(contractPixels).focal_max(dilatePixels)

var s2CloudMasked  = s2.updateMask(s2CloudMask.not());
Map.addLayer(s2CloudMasked,vizParams,'After CloudScore Masking',false);

var s2CloudShadowMasked = projectShadows(s2CloudMask,s2,cloudHeights);
Map.addLayer(s2CloudShadowMasked,vizParams,'After CloudScore and Shadow Masking',false);

var s2MaskedQA = maskS2clouds(s2) ;
Map.addLayer(s2MaskedQA,vizParams,'After QA Masking',false);

var s2sRaw = s2s.map(sentinelCloudScore);
Map.addLayer(s2sRaw.mosaic(),vizParams,'Raw Mosaic', false);

var s2sMosaic = s2sRaw.map(function(img){return img.updateMask(img.select(['cloudScore']).gt(cloudThresh).not())});
Map.addLayer(s2sMosaic.mosaic(),vizParams,'Cloud Masked Mosaic', false);

//Function for wrapping the entire process to be applied across collection
function wrapIt(img){
  img = sentinelCloudScore(img);
  var cloudMask = img.select(['cloudScore']).gt(cloudThresh)
    .focal_min(contractPixels).focal_max(dilatePixels)

  img = projectShadows(cloudMask,img,cloudHeights);

  return img;
}
var s2sMosaicCloudsProjectedDark = s2s.map(wrapIt)

Map.addLayer(s2sMosaicCloudsProjectedDark.mosaic(), vizParams, 'Cloud Masked + Projected Shadows + Dark + Mosaic ');

