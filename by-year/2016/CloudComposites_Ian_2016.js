/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var sa = /* color: d63000 */ee.Geometry.Polygon(
        [[[34.453125, 5.090944175033399],
          [34.27734375, -2.0210651187669897],
          [39.375, -4.915832801313165],
          [41.484375, -1.6696855009865839],
          [41.66015625, 4.653079918274051]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//Main code body written by: Ian Housman, Karis Tenneson, and Carson Stam
//CloudScore function originally written by: Matt Hancher
//Cloud shift function originally written by: Gennadii Donchyts

//Purpose: Mask clouds and cloud shadows in Landsat and/or Sentinel 2 data and export composite
//Sensor options include: Landsat 5, 7, and 8 with the option of not using Landsat 7, and Sentinel 2
//For Landsat, TOA and SR options are supported
//For Landsat SR, Fmask, as well as the Google cloudScore/TDOM/shadowShift methods are supported

//RedCastle Resources, Inc.

//Working onsite at:
//USDA Forest Service
//Remote Sensing Applications Center (RSAC)
//2222 West 2300 South
//Salt Lake City, UT 84119
//Office: (801) 975-3366
//Email: ihousman@fs.fed.us or castam@fs.fed.us
//RSAC FS Intranet website: http://fsweb.rsac.fs.fed.us/
//RSAC FS Internet website: http://www.fs.fed.us/eng/rsac/
/////////////////////////////////////////////////////////////////
//User specified parameters
// var sa = ee.FeatureCollection('ft:1anv7U1hkQoxn-ejlJ9TAvjymkKJblHrPGcN5P45p','geometry').geometry()

var sa = sa;//Specify study area.  Can draw a polygon, manually enter vertices, or import a Fusion Table.  Must use the syntax ee.FeatureCollection('ft:myFusionTableID','geometry').geometry() for a fusion table
var toaOrSRLandsat = 'toa';//Choose toa or sr for top of atmosphere reflectance or surface reflectance using LEDAPS- note fewer scenes are generally available when using surface reflectance
var sentinel2OrLandsatOrHybrid = 'landsat';//Choose landsat, sentinel2, or hybrid for which sensor programs to include- Landsat will include all Landsat sensors 5-8 unless includL7 is set to false, while hybrid will merge Landsat and Sentinel2 data together
var startYear = 2000;//First year to include imagery from
var endYear = 2010;//Last year to include imagery from
var compositingPeriod = 1;//Number of years of data to include in each exported composite
var startJulian =1; // Starting Julian Date- Supports wrapping for tropics and southern hemisphere
var endJulian = 365; // Ending Julian date- Supports wrapping for tropics and southern hemisphere
var metadataCloudCoverMax = 100;//Cloud cover percentage in image metadata threshold- will not include images with cloud cover > this number- set to 100 if using metadata cloud cover is not wanted

var landsatCloudMaskMethod = cloudScoreTDOMShift;//Choose masking method- choices: fMask, cloudScoreTDOMShift.  fMask is only available for Landsat SR
var cloudThresh = 20;//If using the cloudScoreTDOMShift method-Threshold for cloud masking (lower number masks more clouds.  Between 10 and 30 generally works best)
var cloudCloudShadowDilatePixels = 2;//Number of pixels to buffer clouds and cloud shadows by (1 or 2 generally is sufficient)
var cloudHeights = ee.List.sequence(200,5000,500);//Height of clouds to use to project cloud shadows
var includeL7 = true;//Whether to include Landsat 7

var runTDOMLandsat = false;//Whether to run TDOM cloud shadow masking for Landsat.  If set to false, only the solar geometry shadow masking portion will be used
var runTDOMSentinel = false;//Whether to run TDOM cloud shadow masking for Sentinel (likely will need to wait till 2017 until this can be set to true).  If set to false, only the solar geometry shadow masking portion will be used
var zShadowThresh = -0.8;//Threshold for cloud shadow masking- lower number masks out less.  Between -0.8 and -1.2 generally works well
var irSumThresh = 0.35;//Sum of IR bands to include as shadows within TDOM and the shadow shift method (lower number masks out less)

var waterThresh = 0.05;//Threshold for masking water if chosen- lower number masks more

var runDefringe = false;//Whether to run defringe algorithm on L5 
//Export parameters
var exportName = 'Bots'; // Give the study area a descriptive name. This name is used for output composites file names.
var reducerPercentile = 50; // Reducer for compositing
var resolution = 30;//Landsat should be set to 30. Sentinel 2 should be set to 10, 20, or 60 depending on which bands are of interest.  Hybrid can be set to 10, 20, 30, or 60 depending on the need.  60 is the finest resolution that all can be divided without a remainder
var crs = 'EPSG:32734'; // EPSG number for output projection. 32651 = WGS84/UTM Zone 51N. For more info- http://spatialreference.org/ref/epsg/  
var noDataValue = -32678;//Choose a value that is not a real value in any exports
var exportBands = ['blue','green','swir1','swir2','nir','red','temp','NDVI','NBR'];//Bands to export
//////////////////////////////////////////////////////////////////////////////////
//Globals
var toaOrSR;
//Do some error checks
if(toaOrSRLandsat.toLowerCase() === 'sr'& sentinel2OrLandsatOrHybrid.toLowerCase() === 'hybrid'){alert('Hybrid was chosen with surface reflectance Landsat.\nWill combine TOA Sentinel2 and SR Landsat')}
if(startJulian > endJulian){endJulian = endJulian + 365}
if(toaOrSRLandsat.toLowerCase() === 'toa' &  landsatCloudMaskMethod === fMask){
  print('Cannot use fMask with TOA.  Switching landsatCloudMaskMethod to cloudScoreTDOMShift');
  landsatCloudMaskMethod = cloudScoreTDOMShift;
}
var startDate = ee.Date.fromYMD(startYear,1,1).advance(startJulian,'day');
var endDate = ee.Date.fromYMD(endYear,1,1).advance(endJulian,'day');
print('Start and end dates:',startDate,endDate);
////////////////////////////////////////////////////////////////////////////////
var compositingReducer = ee.Reducer.percentile([reducerPercentile]);
//////////////////////////////////////////////////////
//Use data mask from Hansen's Global Forest Change as a watermask
var forestChangeImage = ee.Image('UMD/hansen/global_forest_change_2015');
// var mskW = forestChangeImage.select(['datamask']);
// var mskW = mskW.eq(1);
// Run a focal_mode convolution on the image. 
// var maskFocalMode = mskW.focal_mode();
// Further smooth the image via focal_max
// var waterMask = maskFocalMode.focal_max(5, "square", "pixels", 5 );
//////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//Various lookup dictionaries for band numbers and names
var commonBandNames = ee.List(['blue','green','red','nir','swir1','swir2']);//Band names common to all sensors / TOA or SR corrections
////////////////////////////////////////////////////////////////////////////////
//Various Landsat band dictionaries to handle both SR, TOA, and merging TOA temp w SR spectral 
var sensorBandDictLandsatSR =ee.Dictionary({L8 : ee.List([1,2,3,4,5,6,7]),
                        L7 : ee.List([0,1,2,3,4,5,6]),
                        L5 : ee.List([0,1,2,3,4,5,6]),
                        L4 : ee.List([0,1,2,3,4,5,6])
  });
  
var sensorBandDictLandsatTOA =ee.Dictionary({L8 : ee.List([1,2,3,4,5,9,6]),
                        L7 : ee.List([0,1,2,3,4,5,7]),
                        L5 : ee.List([0,1,2,3,4,5,6]),
                        L4 : ee.List([0,1,2,3,4,5,6])
  });
  
var sensorBandDictLandsatTOATemp = ee.Dictionary({L8 : ee.List([9]),
                        L7 : ee.List([5]),
                        L5 : ee.List([5]),
                        L4 : ee.List([5])
  });
////////////////////////////////////////////////////////////////////////////////
var bandNamesLandsatSRWTOA = ee.List(['blue','green','red','nir','swir1','temp','swir2','cfmask']);
var bandNamesLandsatWOTOA = ee.List(['blue','green','red','nir','swir1','swir2','cfmask']);
var bandNamesLandsatTOA = ee.List(['blue','green','red','nir','swir1','temp','swir2']);
var bandNamesLandsatTOATemp = ee.List(['temp']);

var bandNamesLandsatSRToDivide = ee.List(['blue','green','red','nir','swir1','swir2']);
var bandNamesLandsatSRWTOANotToDivide = ee.List(['temp','cfmask']);
var bandNamesLandsatSRWOTOANotToDivide = ee.List(['cfmask']);
////////////////////////////////////////////
//Sentinel2 L1C band numbers and names
var sensorBandDictSentinel2L1C = ee.Dictionary({S2 : ee.List([ 'B1','B2','B3','B4','B5','B6','B7','B8','B8A', 'B9','B10', 'B11','B12'])});
var bandNamesSentinel2L1C = ee.List(['cb', 'blue', 'green', 'red', 're1','re2','re3','nir', 'nir2', 'waterVapor', 'cirrus','swir1', 'swir2']);
///////////////////////////////////////////////////////
//Dictionary of metadata fields for azimuth for shadow shift method
var solarAzimuthFieldDict = ee.Dictionary({
  S2:'MEAN_SOLAR_AZIMUTH_ANGLE',
  landsatTOA: 'SUN_AZIMUTH',
  landsatSR : 'solar_azimuth_angle'
});
var solarZenithFieldDict = ee.Dictionary({
  S2:'MEAN_SOLAR_ZENITH_ANGLE',
  landsatTOA: 'SUN_ELEVATION',
  landsatSR : 'solar_zenith_angle'
});
//////////////////////////////////////////////////////////////////////////////////
//Various preset min/max stretches for data visualization
var vizParamsCO1 = {'min': 0.05,'max': [0.3,0.6,0.35],   'bands':'swir1,nir,red'};
var vizParamsCO2 = {'min': 0.15,'max': [0.35,0.8,0.4],   'bands':'swir1,nir,red', 'gamma': 1.6};
var vizParamsCO3 = {'min': 0.05,'max': [0.3,0.4,0.4],   'bands':'swir1,nir,red', 'gamma':1.6};
var vizParamsFalse = {'min': 0.1,'max': [0.3,0.3,0.3],   'bands':'nir,swir1,red'};
var vizParamsViz = {'min': 0.05, 'max': 0.3,'bands': 'red,green,blue', 'gamma': 1.6};
var vizParams = vizParamsCO3;
//////////////////////////////////////////////////////////////////////
//Convert geometry to geoJSON for downloading
var regionJSON = sa.toGeoJSONString();
////////////////////////////////////////////////////
//Some client-side functions
//////////////////////////////////////////////////////////////
//Function to compute range list
function range(start, stop, step){
  start = parseInt(start);
  stop = parseInt(stop);
    if (typeof stop=='undefined'){
        // one param defined
        stop = start;
        start = 0;
    }
    if (typeof step=='undefined'){
        step = 1;
    }
    if ((step>0 && start>=stop) || (step<0 && start<=stop)){
        return [];
    }
    var result = [];
    for (var i=start; step>0 ? i<stop : i>stop; i+=step){
        result.push(i);
    }
    return result;
}
////////////////////////////////////////////////
function getRandomInt(min,max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomList(min, max,n) {
  var out = [];
  while(n > 0){
    var t = getRandomInt(min,max);
    out.push(t);
  n= n - 1;
}
   return out;
}
/////////////////////////////////////////////////////////////////////////////////
//Function to handle empty collections that will cause subsequent processes to fail
//If the collection is empty, will fill it with an empty image
function fillEmptyCollections(inCollection,dummyImage){                       
  var dummyCollection = ee.ImageCollection([dummyImage.mask(ee.Image(0))]);
  var imageCount = inCollection.toList(1).length();
  return ee.ImageCollection(ee.Algorithms.If(imageCount.gt(0),inCollection,dummyCollection));

}
//////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
//Function for manually setting no data value generally for exporting
function setNoData(image,noDataValue){
  var m = image.mask();
  image = image.mask(ee.Image(1));
  image = image.where(m.not(),noDataValue);
  return image;
}
/////////////////////////////////////////////////////////////
//Method for applying Fmask cloud and shadow mask- Zhu Woodcock 2012 https://scholar.google.com/citations?view_op=view_citation&hl=en&user=9ODFYW4AAAAJ&citation_for_view=9ODFYW4AAAAJ:eQOLeE2rZwMC
function fMask(img){
  var fmsk = img.select('cfmask');
  var cloudAndShadow = fmsk.eq(2).or(fmsk.eq(4)).eq(0);
  return img.updateMask(img.mask().and(cloudAndShadow));
}
//////////////////////////////////////////////////////////////////////////
var rescale = function(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };
// Compute a cloud score.  This expects the input image to have the common
// band names: ["red", "blue", etc], so it can work across sensors.
function landsatCloudScore(img) {
  // A helper to apply an expression and linearly rescale the output.
 

  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  // Clouds are reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));
 
  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));
   
  // Clouds are reasonably bright in all infrared bands.
  score = score.min(
      rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));

  // Clouds are reasonably cool in temperature.
  score = score.where(img.select(['temp']).mask(),score.min(rescale(img, 'img.temp', [300, 290])));

  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  score =  score.min(rescale(ndsi, 'img', [0.8, 0.6])).multiply(100).byte();
  // Map.addLayer(score,{'min':0,'max':100});
  score = score.lt(cloudThresh).rename('cloudMask');
  img = img.updateMask(img.mask().and(score));
  return img.addBands(score);
}
////////////////////////////////////////
////////////////////////////////////////
// Cloud masking algorithm for Sentinel2
//Built on ideas from Landsat cloudScore algorithm
//Currently in beta and may need tweaking for individual study areas
function sentinelCloudScore(img) {
  // A helper to apply an expression and linearly rescale the output.

  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1);
  
  // Clouds are reasonably bright in the blue and cirrus bands.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.5]));
  score = score.min(rescale(img, 'img.cb', [0.1, 0.3]));
  score = score.min(rescale(img, 'img.cb + img.cirrus', [0.15, 0.2]));
  
  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));

  // Clouds are reasonably bright in all infrared bands.
  // score = score.min(rescale(img, 'img.nir2+img.nir + img.swir1 + img.swir2', [0.3, 0.4]));
  // Map.addLayer(img.select('cb').add(img.select('cirrus')),{'min':0.15,'max':0.25},'cbCirrusSum')
  // Map.addLayer(img.select('cirrus'),{'min':0,'max':0.1},'cirrus')
  // score = score.min(rescale(img, 'img.cirrus', [0.06, 0.09]))
  
  // score = score.max(rescale(img, 'img.cb', [0.4, 0.6]))
  // score = score.min(rescale(img,'img.re1+img.re2+img.re3',[0.6,2]))
  // Map.addLayer(rescale(img,'img.re1+img.re2+img.re3',[0.6,2]),{'min':0,'max':1},'re1')
  // Clouds are reasonably cool in temperature.
  // score = score.min(rescale(img, 'img.temp', [300, 290]));

  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  // Map.addLayer(ndsi,{'min':0.6,'max':0.8},'ndsi')
  // score=score.min(rescale(ndsi, 'img', [0.8, 0.6]))
  score = score.multiply(100).byte();
  // Map.addLayer(score,{'min':0,'max':100},'score')
  // Map.addLayer(img.updateMask(score.lt(0.2)),vizParams,'cm')
  score = score.lt(cloudThresh).rename('cloudMask');
  // Map.addLayer(score)
  img = img.updateMask(img.mask().and(score));
  // Map.addLayer(img,vizParams)
  return img.addBands(score);
}
////////////////////////////////////////////////////// 
//Algorithm to compute liklihood of water
//Builds on logic from Google cloudScore algorithm
function waterScore(img){
      // Compute several indicators of water and take the minimum of them.
      var score = ee.Image(1.0);
      
      
      //Set up some params
      var darkBands = ['green','red','nir','swir2','swir1'];//,'nir','swir1','swir2'];
      var brightBand = 'blue';
      var shadowSumBands = ['nir','swir1','swir2'];
      //Water tends to be dark
      var sum = img.select(shadowSumBands).reduce(ee.Reducer.sum());
      var sum = rescale(sum,'img',[0.35,0.2]).clamp(0,1)
      score = score.min(sum)
      
      //It also tends to be relatively bright in the blue band
      var mean = img.select(darkBands).reduce(ee.Reducer.mean());
      var std = img.select(darkBands).reduce(ee.Reducer.stdDev());
      var z = (img.select([brightBand]).subtract(std)).divide(mean)
      z = rescale(z,'img',[0,1]).clamp(0,1)
      score = score.min(z)
      

      // // Water is at or above freezing
      score = score.min(rescale(img, 'img.temp', [273, 275]));
      
      
      // // Water is nigh in ndsi (aka mndwi)
      var ndsi = img.normalizedDifference(['green', 'swir1']);
      ndsi = rescale(ndsi, 'img', [0.3, 0.8]);
      
      
      score = score.min(ndsi);
      
      return score.clamp(0,1)
      
      }
//////////////////////////////////////////////////////////////////
function maskWater(img){
  var ws = waterScore(img)
  return img.mask(img.mask().and(ws.lt(waterThresh)))
}
/////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
//Function for finding dark outliers in time series
//Original concept written by Carson Stam and adapted by Ian Housman
//Masks pixels that are dark, and dark outliers
function simpleTDOM2(c,zShadowThresh,irSumThresh,dilatePixels){
  var shadowSumBands = ['nir','swir1'];
  
  //Get some pixel-wise stats for the time series
  var irStdDev = c.select(shadowSumBands).reduce(ee.Reducer.stdDev());
  var irMean = c.select(shadowSumBands).mean();
  
  //Mask out dark dark outliers
  c = c.map(function(img){
    var z = img.select(shadowSumBands).subtract(irMean).divide(irStdDev);
    var irSum = img.select(shadowSumBands).reduce(ee.Reducer.sum());
    var m = z.lt(zShadowThresh).reduce(ee.Reducer.sum()).eq(2).and(irSum.lt(irSumThresh)).not();
    m = m.focal_min(dilatePixels);
    return img.addBands(m.rename('TDOMMask'));
  });
  
  return c;
}
/////////////////////////////////////////////
//Function for adding dummy TDOM output for Sentinel and Landsat wo TDOM
function dummyTDOM(img){return img.addBands(ee.Image(0).rename('TDOMMask'));}
/////////////////////////////////////////////
/***
 * Implementation of Basic cloud shadow shift
 * 
 * Author: Gennadii Donchyts
 * License: Apache 2.0
 */
function projectShadows(cloudMask,TDOMMask,image, meanAzimuth,meanZenith,cloudHeights,dilatePixels){
  //Find dark pixels
  var darkPixels = image.select(['nir','swir1','swir2']).reduce(ee.Reducer.sum()).lt(irSumThresh);//.gte(1);
  
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

  var shadow = ee.ImageCollection.fromImages(shadows).max();
 
  //Create shadow mask
  shadow = shadow.updateMask(shadow.mask().and(cloudMask.mask().not()));
  shadow = shadow.focal_max(dilatePixels);
  shadow = shadow.updateMask(shadow.mask().and(darkPixels).and(TDOMMask));
  
  
  return shadow;
}
/////////////////////////////////////////////////////////////////////////////
//Function for wrapping cloud and shadow masking together
//Assumes image has cloud mask band called "cloudMask" and a TDOM mask called "TDOMMask"
//If TDOM is not being used, TDOMMask just needs to be a constant raster band with value 1
function cloudProject(img,dilatePixels,cloudHeights,azimuthField,zenithField){
  
  //Get the cloud mask
  var cloud = img.select('cloudMask').not();
  cloud = cloud.focal_max(dilatePixels);
  cloud = cloud.updateMask(cloud);
  
  //Get TDOM mask
  var TDOMMask = img.select(['TDOMMask']).not();
  
  //Project the shadow finding pixels inside the TDOM mask that are dark and inside the expected area given the solar geometry
  var shadow = projectShadows(cloud,TDOMMask,img, img.get(azimuthField),img.get(zenithField),cloudHeights,dilatePixels);
  
  //Combine the cloud and shadow masks
  var combinedMask = cloud.mask().or(shadow.mask()).eq(0);
  
  //Update the image's mask and return the image
  img = img.updateMask(img.mask().and(combinedMask));
  img = img.addBands(combinedMask.rename(['cloudShadowMask']));
  return img;
}
/////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
//Wrapper function for cloud, TDOM, and shadow shift masking
function cloudScoreTDOMShift(c,landsatOrSentinel,toaOrSRLandsat){
  var azimuthField;var zenithField;
  //Cloud, TDOM, and shift masking for Landsat
  if(landsatOrSentinel.toLowerCase() === 'landsat'){
    //Find azimuth field for respective collection type (SR or TOA)
    if(toaOrSRLandsat.toLowerCase() == 'toa'){
      azimuthField = solarAzimuthFieldDict.get('landsatTOA');
      zenithField = solarZenithFieldDict.get('landsatTOA');
    }
    else{
      azimuthField = solarAzimuthFieldDict.get('landsatSR');
      zenithField = solarZenithFieldDict.get('landsatSR');
    }
    
    //Add the Landsat cloudScore as a band
    print('Adding Landsat cloud mask using a thresholded cloudScore');
    c = c.map(landsatCloudScore);
    
    //Add TDOM band if using TDOM
    if(runTDOMLandsat){
      print('Running Landsat TDOM');
      c = simpleTDOM2(c,zShadowThresh,irSumThresh,cloudCloudShadowDilatePixels)}
    //If not using TDOM, add a constant band with value 1
    else{c = c.map(dummyTDOM)}
  }
  //Cloud, TDOM, and shift masking for Sentinel2
  else{
    print('Adding Sentinel 2 cloud mask using cloudScore');
    //Find azimuth field for Sentinel2
    azimuthField = solarAzimuthFieldDict.get('S2');
    zenithField = solarZenithFieldDict.get('S2');
    //Add the Sentinel2 cloudScore (in beta) as a band
    print('Adding Sentinel2 cloud mask using a thresholded cloudScore');
    c = c.map(sentinelCloudScore);
    
    //Add TDOM band if using TDOM
    if(runTDOMSentinel){
      print('Running Sentinel TDOM');
      c = simpleTDOM2(c,zShadowThresh,irSumThresh,cloudCloudShadowDilatePixels)}
    //If not using TDOM, add a constant band with value 1
    else{c = c.map(dummyTDOM)}
  }
  
  var bns = ee.Image(c.first()).bandNames();
  var ct  = c.reduce(ee.Reducer.percentile([15])).rename(bns);
  Map.addLayer(ct,vizParams,'15 pctl Before composite',false);
  
  //Run cloud project
  c = c.map(function(img){return cloudProject(img,cloudCloudShadowDilatePixels,cloudHeights,azimuthField,zenithField)});
  
  
  
  bns = ee.Image(c.first()).bandNames();
  ct  = c.reduce(ee.Reducer.percentile([15])).rename(bns);
  Map.addLayer(ct,vizParams,'15 pctl Aftercomposite',false);
  return c;
}
////////////////////////////////////////////////////////////////
//Function to merge images from the same date but different collections together
function joinCollections(c1,c2){
  // Define an inner join.
  var innerJoin = ee.Join.inner();
  
  // Specify an equals filter for image timestamps.
  var filterTimeEq = ee.Filter.equals({
    leftField: 'system:time_start',
    rightField: 'system:time_start'
  });
  
  // Apply the join.
  var innerJoined = innerJoin.apply(c1, c2, filterTimeEq);
  
  
  // Map a function to merge the results in the output FeatureCollection.
  var joined = innerJoined.map(function(feature) {
    return ee.Image.cat(feature.get('primary'), feature.get('secondary'));
  });
  return ee.ImageCollection(joined);
}
//////////////////////////////////////////////////////////////////////////////////////////////////
//Function to add common indices
function addIndices(img){
  img = img.addBands(img.normalizedDifference(['nir','red']).rename('NDVI'));
  img = img.addBands(img.normalizedDifference(['nir','swir2']).rename('NBR'));
  return img;
}
//////////////////////////////////////////////////////////////////////////////////////////////////
//Function for acquiring Landsat TOA or SR and Sentinel 2 L1C data
function getImages(startDate,endDate,startJulian,endJulian,sentinel2OrLandsatOrHybrid,toaOrSRLandsat){
  var sentinel2s; var ls;var l4s;var l5s;var l7s;var l8s;var s2s;var l4TOAs;var l5TOAs;var l7TOAs;var l8TOAs;var out;
  
  //First acquire Sentinel2 if chosen
  if(sentinel2OrLandsatOrHybrid.toLowerCase() === 's2'|sentinel2OrLandsatOrHybrid.toLowerCase() === 'sentinel'| sentinel2OrLandsatOrHybrid.toLowerCase() === 'sentinel2'|sentinel2OrLandsatOrHybrid.toLowerCase() === 'hybrid'){
  toaOrSR = 'TOA';
  print('Acquiring Sentinel 2');
  s2s = ee.ImageCollection('COPERNICUS/S2')
                  .filterDate(startDate,endDate)
                  .filter(ee.Filter.calendarRange(startJulian,endJulian))
                  .filterBounds(sa)
                  .filterMetadata('CLOUDY_PIXEL_PERCENTAGE','less_than',metadataCloudCoverMax)
                  .select( sensorBandDictSentinel2L1C.get('S2'),bandNamesSentinel2L1C)
                  .map(function(img){
                    var t = img.divide(10000);//Rescale to 0-1
                    var out = t.copyProperties(img).copyProperties(img,['system:time_start']);
                  return out;
                    });
    // print(s2s.toList(10000000,0).length())
    //Fix for handling inconsistent metadata field names            
    var s2sOld = s2s.filterMetadata('SUN_AZIMUTH_ANGLE','not_equals',null).map(function(img){return img.set('MEAN_SOLAR_AZIMUTH_ANGLE',img.get('SUN_AZIMUTH_ANGLE'))});
    s2s = ee.ImageCollection(s2s.filterMetadata('MEAN_SOLAR_AZIMUTH_ANGLE','not_equals',null).merge(s2sOld));
    // print(s2s.toList(10000,0).map(function(img){return ee.Image(img).get('MEAN_SOLAR_AZIMUTH_ANGLE')}))              
    // print(s2sOld)
    Map.addLayer(s2s.median(),vizParams,'Sentinel before masking composite',false);
   
    s2s =cloudScoreTDOMShift(s2s,'s',toaOrSRLandsat);
    Map.addLayer(s2s.median(),vizParams,'Sentinel 2 Composite',false);
    out = s2s;
    
  }
  //Acquire Landat if chosen
  if(sentinel2OrLandsatOrHybrid.toLowerCase() === 'landsat'| sentinel2OrLandsatOrHybrid.toLowerCase() === 'hybrid'){
    //Acquire SR data if chosen
    if(toaOrSRLandsat.toLowerCase() === 'sr'| toaOrSRLandsat.toLowerCase() === 'surfacereflectance'| toaOrSRLandsat.toLowerCase() === 'surface_reflectance'){
      toaOrSR = 'SR';
      print('Acquiring SR Landsat');
        var l4SRs = ee.ImageCollection('LANDSAT/LT4_SR')
                .filterDate(startDate,endDate)
                .filter(ee.Filter.calendarRange(startJulian,endJulian))
                .filterBounds(sa)
                .select(sensorBandDictLandsatSR.get('L4'),bandNamesLandsatWOTOA);
        var l5SRs = ee.ImageCollection('LANDSAT/LT5_SR')
                .filterDate(startDate,endDate)
                .filter(ee.Filter.calendarRange(startJulian,endJulian))
                .filterBounds(sa)
                .select(sensorBandDictLandsatSR.get('L5'),bandNamesLandsatWOTOA);
        if(includeL7){
          var l7SRs = ee.ImageCollection('LANDSAT/LE7_SR')
                  .filterDate(startDate,endDate)
                  .filter(ee.Filter.calendarRange(startJulian,endJulian))
                  .filterBounds(sa)
                  .select(sensorBandDictLandsatSR.get('L7'),bandNamesLandsatWOTOA);
        }
        var l8SRs = ee.ImageCollection('LANDSAT/LC8_SR')
                .filterDate(startDate,endDate)
                .filter(ee.Filter.calendarRange(startJulian,endJulian))
                .filterBounds(sa)
                .select(sensorBandDictLandsatSR.get('L8'),bandNamesLandsatWOTOA);
        
        //Gather thermal if not using Fmask
        if(landsatCloudMaskMethod === cloudScoreTDOMShift){   
          print('Acquiring Landsat thermal bands');
          l4TOAs = ee.ImageCollection('LANDSAT/LT4_L1T_TOA')
                  .filterDate(startDate,endDate)
                  .filter(ee.Filter.calendarRange(startJulian,endJulian))
                  .filterBounds(sa)
                  .filterMetadata('CLOUD_COVER','less_than',metadataCloudCoverMax)
                  .select(sensorBandDictLandsatTOATemp.get('L4'),bandNamesLandsatTOATemp);
          l5TOAs = ee.ImageCollection('LANDSAT/LT5_L1T_TOA')
                  .filterDate(startDate,endDate)
                  .filter(ee.Filter.calendarRange(startJulian,endJulian))
                  .filterBounds(sa)
                  .filterMetadata('CLOUD_COVER','less_than',metadataCloudCoverMax)
                  .select(sensorBandDictLandsatTOATemp.get('L5'),bandNamesLandsatTOATemp);
          if(includeL7){
            l7TOAs = ee.ImageCollection('LANDSAT/LE7_L1T_TOA')
                    .filterDate(startDate,endDate)
                    .filter(ee.Filter.calendarRange(startJulian,endJulian))
                    .filterBounds(sa)
                    .filterMetadata('CLOUD_COVER','less_than',metadataCloudCoverMax)
                    .select(sensorBandDictLandsatTOATemp.get('L7'),bandNamesLandsatTOATemp);
          }
          l8TOAs = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
                  .filterDate(startDate,endDate)
                  .filter(ee.Filter.calendarRange(startJulian,endJulian))
                  .filterBounds(sa)
                  .filterMetadata('CLOUD_COVER','less_than',metadataCloudCoverMax)
                  .select(sensorBandDictLandsatTOATemp.get('L8'),bandNamesLandsatTOATemp);
          
          //Merge TOA thermal with SR spectral and FMASK bands
          l4s =  joinCollections(l4SRs,l4TOAs).select(bandNamesLandsatSRWTOA);
          l5s =  joinCollections(l5SRs,l5TOAs).select(bandNamesLandsatSRWTOA);

          l8s =  joinCollections(l8SRs,l8TOAs).select(bandNamesLandsatSRWTOA);
          
          //Merge all of the sensors together
          if(includeL7){
            l7s =  joinCollections(l7SRs,l7TOAs).select(bandNamesLandsatSRWTOA);
            ls = ee.ImageCollection(l4s.merge(l5s).merge(l7s).merge(l8s));
          }
          else{
            ls = ee.ImageCollection(l4s.merge(l5s).merge(l8s));
          }
          //Divide bands that were originally SR by 10000
          ls = ls.map(function(img){
            var t = img.select(bandNamesLandsatSRToDivide).divide(10000).float();
            t = t.where(t.eq(2),1);
            img = img.select(bandNamesLandsatSRWTOANotToDivide).addBands(t).select(bandNamesLandsatSRWTOA);
            return img;
          });
          
        }
        else{
        print('Not acquiring any TOA data since using Fmask- cannot user metadata cloud cover filter parameter');
          //No need to get TOA data
          l4s =l4SRs;
          l5s =l5SRs;
          l8s = l8SRs;
          if(includeL7){
            l7s = l7SRs;
            ls = ee.ImageCollection(l4s.merge(l5s).merge(l7s).merge(l8s));
          }
          else{ls = ee.ImageCollection(l4s.merge(l5s).merge(l8s));}
          //Divide SR bands by 10000
          ls = ls.map(function(img){
            var t = img.select(bandNamesLandsatSRToDivide).divide(10000).float();
            img = img.select(bandNamesLandsatSRWOTOANotToDivide).addBands(t).select(bandNamesLandsatWOTOA);
            return img;
          });
        
        }
      }
    //If TOA Landsat is chosen...
    else{
      toaOrSR = 'TOA';
      print('Acquiring TOA Landsat');
          l4TOAs = ee.ImageCollection('LANDSAT/LT4_L1T_TOA')
                  .filterDate(startDate,endDate)
                  .filter(ee.Filter.calendarRange(startJulian,endJulian))
                  .filterBounds(sa)
                  .filterMetadata('CLOUD_COVER','less_than',metadataCloudCoverMax)
                  .select(sensorBandDictLandsatTOA.get('L4'),bandNamesLandsatTOA);
          
          l5TOAs = ee.ImageCollection('LANDSAT/LT5_L1T_TOA')
                  .filterDate(startDate,endDate)
                  .filter(ee.Filter.calendarRange(startJulian,endJulian))
                  .filterBounds(sa)
                  .filterMetadata('CLOUD_COVER','less_than',metadataCloudCoverMax)
                  .select(sensorBandDictLandsatTOA.get('L5'),bandNamesLandsatTOA);
          
          l8TOAs = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
                  .filterDate(startDate,endDate)
                  .filter(ee.Filter.calendarRange(startJulian,endJulian))
                  .filterBounds(sa)
                  .filterMetadata('CLOUD_COVER','less_than',metadataCloudCoverMax)
                  .select(sensorBandDictLandsatTOA.get('L8'),bandNamesLandsatTOA);
          if(includeL7){
            l7TOAs = ee.ImageCollection('LANDSAT/LE7_L1T_TOA')
                    .filterDate(startDate,endDate)
                    .filter(ee.Filter.calendarRange(startJulian,endJulian))
                    .filterBounds(sa)
                    .filterMetadata('CLOUD_COVER','less_than',metadataCloudCoverMax)
                    .select(sensorBandDictLandsatTOA.get('L7'),bandNamesLandsatTOA);
            ls = ee.ImageCollection(l4TOAs.merge(l5TOAs).merge(l7TOAs).merge(l8TOAs));
          }
          else{ls = ee.ImageCollection(l4TOAs.merge(l5TOAs).merge(l8TOAs))}
          
      }
      print(l8TOAs)
      //////////////////////////////////////////////////////////////////////
      Map.addLayer(ls.median(),vizParams,'Landsat before masking composite',false);
      //////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////
      //Now all data are gathered, perform cloud/cloud shadow masking
      if(landsatCloudMaskMethod === cloudScoreTDOMShift ){ 
      print('Cloud masking using cloudScoreTDOMShift');
      ls = landsatCloudMaskMethod(ls,'landsat',toaOrSRLandsat);
     
      }
      else{print('Cloud masking using Fmask');
        ls = ls.map(landsatCloudMaskMethod);
        var bns = ee.Image(ls.first()).bandNames();
        var ct  = ls.reduce(ee.Reducer.percentile([15])).rename(bns);
        Map.addLayer(ct,vizParams,'15 pctl Fmask Aftercomposite',false);
      }
      out = ls;
      Map.addLayer(ls.median(),vizParams,'Landsat Composite',false);
     
    }
    
    //If a hybrid is chosen (use this with caution), merge Sentinel2 and Landsat data together
   if(sentinel2OrLandsatOrHybrid.toLowerCase()==='hybrid'){
     print('Merging Sentinel 2 and Landsat data');
     out = ee.ImageCollection(ls.select(commonBandNames).merge(s2s.select(commonBandNames)));
    Map.addLayer(out.median(),vizParams,'Hybrid Composite',false);
     
   }
   print(out.first())
   out = out.map(addIndices);
   return out;
}
////////////////////////////////////////////////////////////////////////////////
//Get all images and process them
var allImages = getImages(startDate,endDate,startJulian,endJulian,sentinel2OrLandsatOrHybrid,toaOrSRLandsat);
var img2000 = allImages.filterDate(ee.Date.fromYMD(2000,1,1),ee.Date.fromYMD(2000,12,31))
                        .filter(ee.Filter.calendarRange(140,190));
Map.addLayer(img2000,vizParams,'Composite 2000')

var img2006 = allImages.filterDate(ee.Date.fromYMD(2006,1,1),ee.Date.fromYMD(2006,12,31))
                        .filter(ee.Filter.calendarRange(160,350));
Map.addLayer(img2006,vizParams,'Composite 2006')