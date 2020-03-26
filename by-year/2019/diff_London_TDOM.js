/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-0.3853692278981953, 51.414831143651426],
          [0.11641030784267059, 51.41966060728813],
          [0.12113483271036785, 51.55472045810739],
          [-0.387782279894509, 51.55514075011326]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//CloudScore originally written by Matt Hancher and adapted for S2 data by Ian Housman
//////////////////////////////////////////////////////////
//User Params
var startJulian = 120;
var endJulian = 300;
var cloudThresh =20;//Ranges from 1-100.Lower value will mask more pixels out. Generally 10-30 works well with 20 being used most commonly 
var cloudHeights = ee.List.sequence(200,10000,250);//Height of clouds to use to project cloud shadows
var irSumThresh =0.35;//Sum of IR bands to include as shadows within TDOM and the shadow shift method (lower number masks out less)
var dilatePixels = 2; //Pixels to dilate around clouds
var contractPixels = 1;//Pixels to reduce cloud mask and dark shadows by to reduce inclusion of single-pixel comission errors

//////////////////////////////////////////////////////////
var vizParams = {min: 0.05, max: [0.3,0.6,0.35],  bands:['swir1', 'nir', 'red']};
// var vizParams = {bands: ['red', 'green', 'blue'], min: 0, max: 0.3};

//////////////////////////////////////////////////////////////////////////
var rescale = function(img, exp, thresholds) {
  return img.expression(exp, {img: img}).subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
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
//////////////////////////////////////////////////////////////////////////
//Function for finding dark outliers in time series
//Masks pixels that are dark, and dark outliers
function simpleTDOM2(c){
  var shadowSumBands = ['nir','swir1'];
  var irSumThresh = 0.4;
  var zShadowThresh = -1.2;
  //Get some pixel-wise stats for the time series
  var irStdDev = c.select(shadowSumBands).reduce(ee.Reducer.stdDev());
  var irMean = c.select(shadowSumBands).mean();
  var bandNames = ee.Image(c.first()).bandNames();
  print('bandNames',bandNames);
  //Mask out dark dark outliers
  c = c.map(function(img){
    var z = img.select(shadowSumBands).subtract(irMean).divide(irStdDev);
    var irSum = img.select(shadowSumBands).reduce(ee.Reducer.sum());
    var m = z.lt(zShadowThresh).reduce(ee.Reducer.sum()).eq(2).and(irSum.lt(irSumThresh)).not();
    
    return img.updateMask(img.mask().and(m));
  });
  
  return c.select(bandNames);
}

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
  // print('a',meanAzimuth);
  // print('z',meanZenith)
  
  //Find dark pixels
  var darkPixels = image.select(['nir','swir1','swir2']).reduce(ee.Reducer.sum()).lt(irSumThresh)
    .focal_min(contractPixels).focal_max(dilatePixels)
  ;//.gte(1);
  
  
  //Get scale of image
  var nominalScale = cloudMask.projection().nominalScale();
  //Find where cloud shadows should be based on solar geometry
  //Convert to radians
  var azR =ee.Number(meanAzimuth).add(180).multiply(Math.PI).divide(180.0);
  var zenR  =ee.Number(meanZenith).multiply(Math.PI).divide(180.0);
  
  
 
  //Find the shadows
  var shadows = cloudHeights.map(function(cloudHeight){
    cloudHeight = ee.Number(cloudHeight);
    
    var shadowCastedDistance = zenR.tan().multiply(cloudHeight);//Distance shadow is cast
    var x = azR.sin().multiply(shadowCastedDistance).divide(nominalScale);//X distance of shadow
    var y = azR.cos().multiply(shadowCastedDistance).divide(nominalScale);//Y distance of shadow
    // print(x,y)
   
    return cloudMask.changeProj(cloudMask.projection(), cloudMask.projection().translate(x, y));
    
    
  });
  
  
  var shadowMask = ee.ImageCollection.fromImages(shadows).max();
  // Map.addLayer(cloudMask.updateMask(cloudMask),{'min':1,'max':1,'palette':'88F'},'Cloud mask');
  // Map.addLayer(shadowMask.updateMask(shadowMask),{'min':1,'max':1,'palette':'880'},'Shadow mask');
  
  //Create shadow mask
  shadowMask = shadowMask.and(cloudMask.not());
  shadowMask = shadowMask.and(darkPixels).focal_min(contractPixels).focal_max(dilatePixels);
  
  var cloudShadowMask = shadowMask.or(cloudMask);
  
  image = image.updateMask(cloudShadowMask.not()).addBands(shadowMask.rename(['cloudShadowMask']));
  return image;
}

//////////////////////////////////////////////////////
//Function to bust clouds from S2 image
function bustClouds(img){
  img = sentinelCloudScore(img);
  img = img.updateMask(img.select(['cloudScore']).gt(cloudThresh).focal_min(contractPixels).focal_max(dilatePixels).not());
  return img;
}

//////////////////////////////////////////////////////
//Function for wrapping the entire process to be applied across collection
function wrapIt(img){
  img = sentinelCloudScore(img);
  var cloudMask = img.select(['cloudScore']).gt(cloudThresh)
    .focal_min(contractPixels).focal_max(dilatePixels)

  img = projectShadows(cloudMask,img,cloudHeights);

  return img;
}

//////////////////////////////////////////////////////
//Function to find unique values of a field in a collection
function uniqueValues(collection,field){
    var values  =ee.Dictionary(collection.reduceColumns(ee.Reducer.frequencyHistogram(),[field]).get('histogram')).keys();
    
    return values;
  }

/***
 * Sentinel-2 produces multiple images, resultsing sometimes 4x more images than the actual size. 
 * This is bad for any statistical analysis.
 * 
 * This function mosaics images by time. 
 */
function mosaicByTime(images) {
  var TIME_FIELD = 'system:time_start'

  var distinct = images.distinct([TIME_FIELD])

  var filter = ee.Filter.equals({ leftField: TIME_FIELD, rightField: TIME_FIELD });
  var join = ee.Join.saveAll('matches')
  var results = join.apply(distinct, images, filter)

  // mosaic
  results = results.map(function(i) {
    var mosaic = ee.ImageCollection.fromImages(i.get('matches')).sort('system:index').mosaic()
    
    return mosaic.copyProperties(i).set(TIME_FIELD, i.get(TIME_FIELD))
  })
  
  return ee.ImageCollection(results)
}

function getImages(startYear, endYear) {
  //////////////////////////////////////////////////////
  //Get some s2 data
  return ee.ImageCollection('COPERNICUS/S2')
                    .filter(ee.Filter.calendarRange(startYear,endYear,'year'))
                    .filter(ee.Filter.calendarRange(startJulian,endJulian))
                    .filterBounds(geometry)
                    .map(function(img){
                      
                      var t = img.select([ 'B1','B2','B3','B4','B5','B6','B7','B8','B8A', 'B9','B10', 'B11','B12']).divide(10000);//Rescale to 0-1
                      t = t.addBands(img.select(['QA60']));
                      var out = t.copyProperties(img).copyProperties(img,['system:time_start']);
                    return out;
                      })
                      .select(['QA60', 'B1','B2','B3','B4','B5','B6','B7','B8','B8A', 'B9','B10', 'B11','B12'],['QA60','cb', 'blue', 'green', 'red', 're1','re2','re3','nir', 'nir2', 'waterVapor', 'cirrus','swir1', 'swir2']);
}


//Convert to daily mosaics to avoid redundent observations in MGRS overlap areas and edge artifacts for shadow masking
//s2s = dailyMosaics(s2s);
//print(s2s);

var images2016 = mosaicByTime(getImages(2016, 2017)).map(wrapIt)
var images2017 = mosaicByTime(getImages(2017, 2018)).map(wrapIt)

print(images2016)

var p = 50
var image2016 = images2016.select(vizParams.bands).reduce(ee.Reducer.percentile([p])).rename(vizParams.bands)
var image2017 = images2017.select(vizParams.bands).reduce(ee.Reducer.percentile([p])).rename(vizParams.bands)

Map.addLayer(image2016, vizParams, '2016', false);
Map.addLayer(image2017, vizParams, '2017', false);

var ndvi2016 = images2016.map(function(i) { return i.normalizedDifference(['nir', 'red']).clamp(-0.15, 0.15) }).reduce(ee.Reducer.percentile([p]))
var ndvi2017 = images2017.map(function(i) { return i.normalizedDifference(['nir', 'red']).clamp(-0.15, 0.15) }).reduce(ee.Reducer.percentile([p]))

var colorbrewer = require('users/gena/packages:colorbrewer')
var diff = ndvi2017.subtract(ndvi2016)
Map.addLayer(diff.mask(diff.abs().add(0.3).multiply(2)), {min: -0.1, max: 0.1, palette: colorbrewer.Palettes.RdYlGn[5]}, 'diff')

