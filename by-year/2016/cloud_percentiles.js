/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA_FMASK");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var clouds8 = l8
  .map(function(i) { 
    return ee.Algorithms.Landsat.simpleCloudScore(i).select('cloud'); 
  })

var clouds7 = l7
  .map(function(i) { 
    return ee.Algorithms.Landsat.simpleCloudScore(i).select('cloud'); 
  })

var clouds5 = l5
  .map(function(i) { 
    return ee.Algorithms.Landsat.simpleCloudScore(i).select('cloud'); 
  })
  
  
var startDate = '1999-01-01'
var stopDate = '2016-01-01'

var clouds = ee.ImageCollection(clouds8.merge(clouds7).merge(clouds5))
  .filterDate(startDate, stopDate)

Map.addLayer(clouds.count(), {min:0, max:100}, 'count')
Map.addLayer(clouds.mean().unitScale(0, 100), {}, 'cloud mean')

var percentiles = ee.List.sequence(0, 100, 1)

var cloudPercentiles = clouds.reduce(ee.Reducer.percentile(percentiles))

Map.addLayer(cloudPercentiles, {}, 'cloud percentiles', false)
  
// MODIS

return

function cloudScore(img) {
  
  // A helper to apply an expression and linearly rescale the output.
  var rescale = function(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };

  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  
  // Clouds are reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));
  
  // Clouds are reasonably bright in all visible bands.
  var vizSum = rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]);
  score = score.min(vizSum);
  
  // Clouds are reasonably bright in all infrared bands.
  var irSum =rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]) 
  score = score.min(
      irSum);
  
  // Clouds are reasonably cool in temperature.
  var tempScore = rescale(img, 'img.temp', [305, 300])
  // score = score.min(tempScore);
  
  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  var snowScore = rescale(ndsi, 'img', [0.8, 0.6])
  score =score.min(snowScore)
  
  //For MODIS, provide the option of not using thermal since it introduces
  //a precomputed mask that may or may not be wanted
  if(useTempInCloudMask === true){
    score = score.min(tempScore);
  }
  
  score = score.multiply(100);

  return score;
}

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////
//Some globals to deal with multi-spectral MODIS
var wTempSelectOrder = [2,3,0,1,4,6,5];//Band order to select to be Landsat 5-like if thermal is included
var wTempStdNames = ['blue', 'green', 'red', 'nir', 'swir1','temp','swir2'];

var woTempSelectOrder = [2,3,0,1,4,5];//Band order to select to be Landsat 5-like if thermal is excluded
var woTempStdNames = ['blue', 'green', 'red', 'nir', 'swir1','swir2'];

//Band names from different MODIS resolutions
//Try to take the highest spatial res for a given band
var modis250SelectBands = ['sur_refl_b01','sur_refl_b02'];
var modis250BandNames = ['red','nir'];

var modis500SelectBands = ['sur_refl_b03','sur_refl_b04','sur_refl_b06','sur_refl_b07'];
var modis500BandNames = ['blue','green','swir1','swir2'];

var combinedModisBandNames = ['red','nir','blue','green','swir1','swir2'];

//Dictionary of MODIS collections
var modisCDict = {
  'eightDayNDVIA' : 'MODIS/MYD13Q1',
  'eightDayNDVIT' : 'MODIS/MOD13Q1',
  
  
  'eightDaySR250A' : 'MODIS/MYD09Q1',
  'eightDaySR250T' : 'MODIS/MOD09Q1',
  
  'eightDaySR500A' : 'MODIS/MYD09A1',
  'eightDaySR500T' : 'MODIS/MOD09A1',
  
  'eightDayLST1000A' : 'MODIS/MYD11A2',
  'eightDayLST1000T' : 'MODIS/MOD11A2',
  
  // 'dailyNDVIA' : 'MODIS/MYD09GA_NDVI',
  // 'dailyNDVIT' : 'MODIS/MOD09GA_NDVI',
  
  
  'dailySR250A' : 'MODIS/MYD09GQ',
  'dailySR250T' : 'MODIS/MOD09GQ',
  
  'dailySR500A' : 'MODIS/MYD09GA',
  'dailySR500T' : 'MODIS/MOD09GA',
  
  'dailyLST1000A' : 'MODIS/MYD11A1',
  'dailyLST1000T' : 'MODIS/MOD11A1',
}

/////////////////////////////////////////////////
//Helper function to join two collections- Source: code.earthengine.google.com
    function joinCollections(c1,c2){
      var MergeBands = function(element) {
        // A function to merge the bands together.
        // After a join, results are in 'primary' and 'secondary' properties.
        return ee.Image.cat(element.get('primary'), element.get('secondary'));
      };

      var join = ee.Join.inner();
      var filter = ee.Filter.equals('system:time_start', null, 'system:time_start');
      var joined = ee.ImageCollection(join.apply(c1, c2, filter));
     
      joined = ee.ImageCollection(joined.map(MergeBands));
      joined = joined.map(function(img){return img.mask(img.mask().and(img.reduce(ee.Reducer.min()).neq(0)))})
      return joined;
    }

//////////////////////////////////////////////////////
//Function to remove cloud shadows
//Works by identifying dark outliers in the infrared bands
function simpleTDOM(collection,zShadowThresh,zCloudThresh,maskAllDarkPixels){
  //Set up some variables
      var shadowSumBands = ['nir','swir1','swir2']
      var sSName = 'shadowSum'
      var startBandNames = ee.Image(collection.first()).bandNames();
      
      //Add the sum of the infrared to all images
      var collection = collection.map(function(img){
        var shadowSum = img.select(shadowSumBands).reduce(ee.Reducer.sum()).select([0],[sSName])
        return img.addBands(shadowSum);
      })
      
      //If a first cut of masking very dark pixels is chosen, then mask all very dark pixels
      //This works kind of like the two-step approach in Fmask with individual image-based
      //masking and then a time series-based method
      if(maskAllDarkPixels === true){
        collection = collection.map(function(img){
          return img.mask(img.mask().and(img.select([sSName]).gt(shadowThresh)))
        })
      } 
      
      //Compute the stdDev and mean of the sum of the infrared bands fo z-score analysis
      var shadowStd = collection.select(sSName).reduce(ee.Reducer.stdDev());
      var shadowMean = collection.select(sSName).mean();
      
      //Compute z-score and mask pixels falling below a specified threshold
      collection = collection.map(function(img){
        var tShadowSum = img.select(shadowSumBands).reduce(ee.Reducer.sum()).select([0],['shadowSumT']);
        var zScore = tShadowSum.subtract(shadowMean).divide(shadowStd).select([0],['zShadow']);
        var m = zScore.gt(zShadowThresh).and(zScore.lt(zCloudThresh));
        return img.mask(img.mask().and(m)).select(startBandNames);
      })
      return collection
    } 
//////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
//Function to get MODIS data from various collections
//Will pull from daily or 8-day composite collections based on the boolean variable "daily"
function modisCloudScore(startDate,endDate,startJulian,endJulian,daily){
      //Find which collections to pull from based on daily or 8-day
      if(daily === false){
        var a250C = modisCDict.eightDaySR250A;
        var t250C = modisCDict.eightDaySR250T;
        var a500C = modisCDict.eightDaySR500A;
        var t500C = modisCDict.eightDaySR500T;
        var a1000C = modisCDict.eightDayLST1000A;
        var t1000C = modisCDict.eightDayLST1000T;
      }
     else{
        var a250C = modisCDict.dailySR250A;
        var t250C = modisCDict.dailySR250T;
        var a500C = modisCDict.dailySR500A;
        var t500C = modisCDict.dailySR500T;
        
        var a1000C = modisCDict.dailyLST1000A;
        var t1000C = modisCDict.dailyLST1000T;
      };
      
    //Pull images from each of the collections  
    var a250 = ee.ImageCollection(a250C)
              .filterDate(startDate,endDate)
              .filter(ee.Filter.calendarRange(startJulian,endJulian))
              .select(modis250SelectBands,modis250BandNames)
              
    var t250 = ee.ImageCollection(t250C)
              .filterDate(startDate,endDate)
              .filter(ee.Filter.calendarRange(startJulian,endJulian))
              .select(modis250SelectBands,modis250BandNames)
              
    var a500 = ee.ImageCollection(a500C)
              .filterDate(startDate,endDate)
              .filter(ee.Filter.calendarRange(startJulian,endJulian))
              
              //Mask pixels above a certain zenith
              if(daily === true){
                a500 = a500
              .map(function(img){
                var img = img.mask(img.mask().and(img.select(['SensorZenith']).lt(zenithThresh*100)))
                return img
              })
              }
              a500 = a500
              .select(modis500SelectBands,modis500BandNames)
              
    var t500 = ee.ImageCollection(t500C)
              .filterDate(startDate,endDate)
              .filter(ee.Filter.calendarRange(startJulian,endJulian))

              //Mask pixels above a certain zenith
              if(daily === true){
                t500 = t500
               
              .map(function(img){
                
                var img = img.mask(img.mask().and(img.select(['SensorZenith']).lt(zenithThresh*100)))
                return img})
           
              }
              t500 = t500
              
              .select(modis500SelectBands,modis500BandNames)
              
    
    //If thermal collection is wanted, pull it as well
    if(useTempInCloudMask === true){
       var t1000 = ee.ImageCollection(t1000C)
              .filterDate(startDate,endDate)
              .filter(ee.Filter.calendarRange(startJulian,endJulian))
              .filterBounds(fB) 
              .select([0])
              
        var a1000 = ee.ImageCollection(a1000C)
              .filterDate(startDate,endDate)
              .filter(ee.Filter.calendarRange(startJulian,endJulian))
              .filterBounds(fB)
              .select([0])
              
    }
    
    //Now all collections are pulled, start joining them
    //First join the 250 and 500 m Aqua
       var a = joinCollections(a250,a500);
      
      //Then Terra
      var t = joinCollections(t250,t500);
      
      //If temp was pulled, join that in as well
      //Also select the bands in an L5-like order and give descriptive names
      if(useTempInCloudMask === true){
        a = joinCollections(a,a1000)
        t = joinCollections(t,t1000)
        var tSelectOrder = wTempSelectOrder;
        var tStdNames = wTempStdNames;
      }
      //If no thermal was pulled, leave that out
      else{var tSelectOrder = woTempSelectOrder;
        var tStdNames = woTempStdNames;
      };
      
      //Join Terra and Aqua 
      var joined = ee.ImageCollection(a.merge(t)).select(tSelectOrder,tStdNames);
     
      //Divide by 10000 to make it work with cloud masking algorithm out of the box
      joined = joined.map(function(img){return img.divide(10000).float()
        .copyProperties(img,['system:time_start','system:time_end'])
        
      })

      print('Collection',joined);

      //Since MODIS thermal is divided by 0.02, multiply it by that and 10000 if it was included
      if(useTempInCloudMask === true){
      joined = joined.map(function(img){
        var t = img.select(['temp']).multiply(0.02*10000);
        return img.select(['blue','green','red','nir','swir1','swir2'])
        .addBands(t).select([0,1,2,3,4,6,5])
      
      })
      }
    
    //Get some descriptive names for displaying layers
    var name = 'surRefl';
    if(daily === true){
      name = name + '_daily'
    }
    else{name = name + '8DayComposite'};
   

   //Compute cloud score and mask cloudy pixels
      var cs = joined.map(function(img,useTempInCloudMask){
        return cloudScore(img);
      });
    
    //Add first image as well as median for visualization
    Map.addLayer(ee.Image(cs.mean()),{},'MODIS cloud score',true);

  }
  
/////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
//Input parameters
var startDate = ee.Date(startDate);//Image collection start date
var endDate = ee.Date(stopDate);//Image collection end date
var startJulian = 0;//Start julian date
var endJulian = 365;//End julian date

var daily = true;//Whether to use daily MODIS (true) or 8 day composites (false)

var zenithThresh  = 90;//If daily == true, Zenith threshold for daily acquisitions for including observations

var cloudThresh = 10;//Threshold for masking clouds (0-100)- masks more as it approaches 0. 10-30 generally works well

var useTempInCloudMask = false;//Whether to use the temperature band in cloud masking

var runTDOM = true;//Whether to run TDOM
var maskAllDarkPixels = false;//Whether to perform a first cut masking of all dark pixels for shadow masking

var shadowThresh = 0.1;//If maskAllDarkPixels == true, a first cut of cloud shadow masking.  Generally 0.1-0.15 works well
var zShadowThresh = -0.8;//Z-score threshold for cloud shadows. Generally -0.8 to -2.0 works well.  Masks more as it approaches 0
var zCloudThresh = 3;//Z-score threshold for masking any missed clouds.  Generally 3-4 works well


modisCloudScore(startDate,endDate,startJulian,endJulian,daily)

