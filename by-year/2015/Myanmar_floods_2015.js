/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.Polygon(
        [[[93.065185546875, 18.17829245619009],
          [95.51513671875, 17.38322362205545],
          [96.13037109375, 18.959365014620538],
          [95.69091796875, 21.126600834506824],
          [93.97705078125, 21.96452178306762],
          [91.9775390625, 21.351882664015182]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//RSAC_Temporal_Dark_Outlier_Mask(TDOM)_Compositing_Script_13_7_15

//Code written by:
//Cloud/Shadow masking- Carson Stam
//Everything else- Ian Housman

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
//Start globals

//User inputs
//Enter study area
//Specify fusion table or some feature collection
// var fB = ee.FeatureCollection(ee.Feature(ee.Geometry.Rectangle(getMapBounds())));
// var lamdong = ee.FeatureCollection('ft:1gMuvRqSZY7vtO5CRlZec92eWO0AeVB02Q3Drm6bi','geometry')//.map(function(f){return f.simplify(1000).buffer(10000)});
// var measa_kongma = ee.FeatureCollection('ft:12edoyFmPdVoMyRXoRUrs_8tbJpx7XSrz9xnIXgRB','geometry')//.map(function(f){return f.buffer(1000)});

//Set fB equal to the chosen fusion table or feature collection
var country_name = 'TestArea';
// var countries = ee.FeatureCollection('ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw');
// var country = countries.filterMetadata('Country', 'equals', country_name);
// var studyArea = ee.FeatureCollection([ee.Feature(ee.Geometry.Polygon(country.geometry().bounds().getInfo().coordinates[0])).buffer(20000)]);
// var geometry = ee.Geometry.Polygon([[101.14906153329343,-2.337033962910551],
// [101.33790090221635,-2.3370340442605144],
// [101.33275038914974,-2.2793975934494903],
// [101.32622698976513,-2.216272000589654],
// [101.14700181846479,-2.2197026826208233],
// [101.14906153329343,-2.337033962910551]]);
var studyArea = ee.FeatureCollection([ee.Feature(geometry)]);

var fB=studyArea
var saName = country_name

var crs = 'EPSG:4326'


//Compositing Parameters
var years = [2000,2002,2004,2006,2008,2010,2012,2014];//Specify years- can enter a list or use range() function
var compositingPeriod = 1;//Number of years to include in the composite
var startJulian = 100;//Start julian date- supports wrapping
var endJulian = 300;//End julian date


var shadowLookBack = 5;//Number of years to look back for cloud shadow masking
var shadowLookForward = 3;//Number of years to look forward for cloud shadow masking

//More user inputs
var cloudThresh = 20;//Specify the cloud threshold- lower number = more clouds are excluded


//Specify which masks to apply
//Enter 'water' and 'snow' respectively
var maskApply =ee.List([''])
var waterThresh = 0.05;//Lower number masks more out  (0-1)
var snowThresh = 0.05;//Lower number masks more out (0-1)

var possibleSensors = ee.List(['L5','L7','L8']) //Specify which sensors to pull from- supports L5,L7, and L8
var prioritizeL5 = ee.Number(0); //Binary 1 = True, 0 = False for prioritizing L5, L8, then L7 in compositing
var reducer = ee.Reducer.percentile([50]);//Reducer for compositing

var shadowSumBands = ee.List(['nir','swir1','swir2']);//Bands for shadow masking
var zShadowThresh = -1; //Z score in which shadows are expected to be below 

//Names of collections to look in
//Add _L1T for L1T imagery
//TOA is computed on both the L1G or L1T
var collection_dict = {L8: 'LC8',
                         L7: 'LE7',
                         L5: 'LT5',
                         L4: 'LT4'
  };


//Band combinations for each sensor corresponding to final selected corresponding bands                        
  var sensor_band_dict =ee.Dictionary({L8 : ee.List([1,2,3,4,5,9,6]),
                        L7 : ee.List([0,1,2,3,4,5,7]),
                        L5 : ee.List([0,1,2,3,4,5,6]),
                        L4 : ee.List([0,1,2,3,4,5,6])
  });
var spacecraft_dict = {'Landsat4': 'L4','Landsat5': 'L5','Landsat7': 'L7', 'LANDSAT_8': 'L8'};

//End user inputs
//////////////////////////////////////////////////////////////////
//Finds the minimum bounding rectangle from the study area
var region = fB.geometry().bounds().getInfo().coordinates[0];

var allImages = ee.ImageCollection([ee.Image(1).set('system:time_start',new Date('1/1/1940'))])
//////////////////////////////////////////////////////////////////
//Some visualization parameters for stretching the bands
var peruM = [ 0.1180300,0.2614512,0.04743784];
var peruS = [0.0312486, 0.0527525, 0.0099494];
var n1 = 5;
var n2 = 5;
var mins = [peruM[0] -peruS[0]*n1,peruM[1] -peruS[1]*n1,peruM[2] -peruS[2]*n1];
var maxes = [peruM[0] +peruS[0]*n2,peruM[1] +peruS[1]*n2,peruM[2] +peruS[2]*n2];
var vizParamsPeru = {'min': mins,'max':maxes,   'bands':'swir1,nir,red'};

var vizParamsCO1 = {'min': 0.05,'max': [.3,0.4,.4],   'bands':'swir1,nir,red'};
var vizParamsCO2 = {'min': 0.15,'max': [.35,.8,.4],   'bands':'swir1,nir,red', 'gamma': 1.6};
//var vizParams = vizParamsPeru;
var vizParamsCO3 = {'min': 0.05,'max': [.3,0.4,.4],   'bands':'swir1,nir,red', 'gamma':1.6};
var vizParamsFalse = {'min': 0.1,'max': [.3,0.3,.3],   'bands':'nir,swir1,red'};
var vizParamsViz = {'min': 0.05, 'max': 0.3,'bands': 'red,green,blue', 'gamma': 1.6};

//Choose which visualization parameter to use
var vizParams = vizParamsCO1


///////////////////////////////////////////////////////////////////////////////
var bandNames = ee.List(['blue','green','red','nir','swir1','temp','swir2']);
var STD_NAMES = ['blue','green','red','nir','swir1','temp','swir2'];

///////////////////////////////////////////////////////////////////////////////
var bandNumbers = [0,1,2,3,4,5,6];
var tcBandNumbers = [0,1,2,3,4,6];

////////////////////////////////////////////////////////////////
function range(start, stop, step){
  start = parseInt(start);
  stop = parseInt(stop);
    if (typeof stop=='undefined'){
        // one param defined
        stop = start;
        start = 0;
    };
    if (typeof step=='undefined'){
        step = 1;
    };
    if ((step>0 && start>=stop) || (step<0 && start<=stop)){
        return [];
    };
    var result = [];
    for (var i=start; step>0 ? i<stop : i>stop; i+=step){
        result.push(i);
    };
    return result;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function to mask clouds, ensure data exists in every band, and defringe images
//Assumes the image is a Landsat image
function maskCloudsAndSuch(img){
    //Bust clouds
    var cs = ee.Algorithms.Landsat.simpleCloudScore(img).select(['cloud']).gt(cloudThresh)
    // cs = cs.focal_min(1,'circle','pixels',cloudContractIterations)
    // cs = cs.focal_max(1,'circle','pixels',cloudExpandIterations)
    //Make sure all or no bands have data
    var numberBandsHaveData = img.mask().reduce(ee.Reducer.sum())
    var allOrNoBandsHaveData = numberBandsHaveData.eq(0).or(numberBandsHaveData.gte(7))
    
    //If it's Landsat 5- defringe by nibbling away at the fringes
    // var allBandsHaveData = ee.Image(ee.Algorithms.If(ee.String(img.get('SPACECRAFT_ID')).index(ee.String('Landsat5')).eq(-1),allOrNoBandsHaveData.focal_min(1,'square','pixels',8),allOrNoBandsHaveData))
    var allBandsHaveData = allOrNoBandsHaveData//.focal_min(1,'square','pixels',8)
    
    //Make sure no band is just under zero
    var allBandsGT = img.reduce(ee.Reducer.min()).gt(-0.001)
    return img.mask(img.mask().and(cs.not()).and(allBandsHaveData).and(allBandsGT))
    
  };
//////////////////////////////////////////////////////////////////
function maskSnow(img){
  var ss = snowScore(img)
  return img.mask(img.mask().and(ss.lt(snowThresh)))
}
//////////////////////////////////////////////////////////////////
function maskWater(img){
  var ws = waterScore(img)
  return img.mask(img.mask().and(ws.lt(waterThresh)))
}
/////////////////////////////////////////////////////////////////
function addDateBand(img){
  var d = ee.Date(img.get('system:time_start'))
  var y = d.get('year')
  var d = y.add(d.getFraction('year'))
  return img.addBands(ee.Image.constant(d).float().select([0],['year']))
} 
//////////////////////////////////////////////////////////////////
function addShadowSum(img){
    return img.addBands(img.select(shadowSumBands).reduce(ee.Reducer.sum()).select([0],['shadowSum']));
  }
//////////////////////////////////////////////////////////////////
function zShadowMask(img,meanShadowDark,stdShadowDark){
    var imgDark = img.select(['shadowSum'])
    var shadowZ = imgDark.subtract(meanShadowDark).divide(stdShadowDark)
    var shadows = shadowZ.lt(zShadowThresh);
    
    // shadows = shadows.focal_min(1,'circle','pixels',shadowContractIterations)
    // shadows = shadows.focal_max(1,'circle','pixels',shadowExpandIterations)
    return img.mask(img.mask().and(shadows.not()))
  }
//////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
function rescale(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };
/////////////////////////////////////////////////////////////
function snowScore(img){
      // Compute several indicators of snowyness and take the minimum of them.
      var score = ee.Image(1.0);
      // Snow is reasonably bright in the blue band.
      score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));
    
      // Snow is reasonably bright in all visible bands.
      score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));
    
      // // Excluded this for snow reasonably bright in all infrared bands.
      // score = score.min(
      //     rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));
    
      // Snow is reasonably cool in temperature.
      //Changed from [300,290] to [290,275] for AK
      score = score.min(rescale(img, 'img.temp', [300, 285]));
      
      
       // Snow is high in ndsi.
      var ndsi = img.normalizedDifference(['green', 'swir1']);
      ndsi = rescale(ndsi, 'img', [0.5, 0.7]);
      score = score.min(ndsi);
      
      return score.clamp(0,1)
      
      }
//////////////////////////////////////////////////////      
function waterScore(img){
      // Compute several indicators of water and take the minimum of them.
      var score = ee.Image(1.0);
      
      
      //Set up some params
      var darkBands = ['green','red','nir','swir2','swir1'];//,'nir','swir1','swir2'];
      var brightBand = 'blue'
      
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
//////////////////////////////////////////////////////////////////////////
//Functions for computing tasseled cap transform
//Author:  Ian Housman
/////////////////////////////////////////////////////////////////////////
//Baig 2014 coeffs - TOA refl (http://www.tandfonline.com/doi/pdf/10.1080/2150704X.2014.915434)
var l8_tc_coeffs = [ee.Image([0.3029, 0.2786, 0.4733, 0.5599, 0.508, 0.1872]),
                    ee.Image([-0.2941, -0.243, -0.5424, 0.7276, 0.0713, -0.1608]),
                    ee.Image([ 0.1511, 0.1973, 0.3283, 0.3407, -0.7117, -0.4559]),
                    ee.Image([-0.8239, 0.0849, 0.4396, -0.058, 0.2013, -0.2773]),
                    ee.Image([-0.3294, 0.0557, 0.1056, 0.1855, -0.4349, 0.8085]),
                    ee.Image([0.1079, -0.9023, 0.4119, 0.0575, -0.0259, 0.0252])];
//Huang 2002 coeffs - TOA refl (http://landcover.usgs.gov/pdf/tasseled.pdf)
var l7_tc_coeffs = [ee.Image([0.3561, 0.3972, 0.3904, 0.6966, 0.2286, 0.1596]),
                    ee.Image([-0.3344, -0.3544, -0.4556, 0.6966, -0.0242, -0.2630]),
                    ee.Image([0.2626, 0.2141, 0.0926, 0.0656, -0.7629, -0.5388]),
                    ee.Image([0.0805, -0.0498, 0.1950, -0.1327, 0.5752, -0.7775]),
                    ee.Image([-0.7252, -0.0202, 0.6683, 0.0631, -0.1494, -0.0274]),
                    ee.Image([0.4000, -0.8172, 0.3832, 0.0602, -0.1095, 0.0985])];

//Crist 1985 coeffs - TOA refl (http://www.gis.usu.edu/~doug/RS5750/assign/OLD/RSE(17)-301.pdf)
var l5_tc_coeffs = [ee.Image([0.2043, 0.4158, 0.5524, 0.5741, 0.3124, 0.2303]),
                    ee.Image([-0.1603, -0.2819, -0.4934, 0.7940, -0.0002, -0.1446]),
                    ee.Image([0.0315, 0.2021, 0.3102, 0.1594, -0.6806, -0.6109]),
                    ee.Image([-0.2117, -0.0284, 0.1302, -0.1007, 0.6529, -0.7078]),
                    ee.Image([-0.8669, -0.1835, 0.3856, 0.0408, -0.1132, 0.2272]),
                    ee.Image([0.3677, -0.8200, 0.4354, 0.0518, -0.0066, -0.0104])]
/////////////////////////////////////////////////////////////////////////////////                    
var tc_coeff_dict = {L5: l5_tc_coeffs,L7: l7_tc_coeffs, L8: l8_tc_coeffs};
var tc_names = ['Brightness','Greenness', 'Wetness', 'TCT4','TCT5','TCT6'];
var tc_names_a = ['Brightness','Greenness', 'Wetness', 'TCT4','TCT5','TCT6','Angle'];
/////////////////////////////////////////////////////////////////////////////////
//Function to compute tc transformation using the coeffs above
var tc = function(image, sensor){
  //Nested function to do the multiplication and addition
  var mult_sum = function(matrix){
    return image.multiply(matrix).reduce(ee.call("Reducer.sum"));
    };
  //Find the coeffs
  var coeffs = tc_coeff_dict[sensor];
  
  //Compute the tc transformation and give it useful names
  var tco = ee.Image(coeffs.map(mult_sum)).select([0,1,2,3,4,5], tc_names);
  
  
  //From: http://www.fs.fed.us/rm/pubs_other/rmrs_2010_powell_s001.pdf
  var angle = tco.select('Greenness').divide(tco.select('Brightness')).atan();
  tco = tco.addBands(angle).select([0,1,2,3,4,5,6],tc_names_a);
  
  return tco;
};
/////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////
//Function to add some common indices to an image
//Indices are appended to the provided image
//It assumes the image has common names ['blue','green','red','nir','swir1','temp','swir2]
var addIndices = function(in_image){

  
    in_image = in_image.select(bandNumbers,bandNames);
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'red']).select([0],['ndvi']));
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'swir2']).select([0],['nbr']));
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'swir1']).select([0],['ndmi']));
    in_image = in_image.addBands(in_image.normalizedDifference(['green', 'red']).select([0],['vig']));
    in_image = in_image.addBands(in_image.normalizedDifference(['green', 'swir1']).select([0],['ndsi']));
    in_image = in_image.addBands(in_image.normalizedDifference(['red', 'blue']).select([0],['ndwfi']));
    
    //Add taselled cap
    //Assumes L5 coeffs for all images, but may want to alter if not mixing sensors
    in_image = in_image.addBands(tc(in_image.select(tcBandNumbers),'L5'));
    
    //Algorithm from Vincent2004 to estimate phycocyanin content (PC) from a linear combination of LANDSAT bands
    //in_image = in_image.addBands(in_image.expression("47.7-9.21*b('red')/b('blue')+29.7 * b('nir')/b('blue')-118*b('nir')/b('red')-6.81*b('swir1')/b('red')+41.9*b('swir2')/b('red')-14.7*b('swir2')/b('nir')").select([0],['PC']));
    
    return in_image;
  
};
/////////////////////////////////////////////////////////////////////////////////
//Function to handle empty collections that will cause subsequent processes to fail
//If the collection is empty, will fill it with an empty image
function fillEmptyCollections(inCollection,dummyImage){                       
  var dummyCollection = ee.ImageCollection([dummyImage.mask(ee.Image(0))])
  var imageCount = inCollection.toList(1).length()
  return ee.ImageCollection(ee.Algorithms.If(imageCount.gt(0),inCollection,dummyCollection))

}
//////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
//Wrapper function to get composite
var metadataFC = ''
function getImage(year,compositingPeriod, startJulian,endJulian,shadowLookBack,shadowLookForward,singleImageMode){
  //Define dates
  var y1Image = year;
  var y2Image = year + compositingPeriod-1
  
  var startDate = ee.Date.fromYMD(ee.Number(year),1,1).advance(startJulian,'day');
  var endDate = ee.Date.fromYMD(ee.Number(year).add(ee.Number(compositingPeriod)).subtract(ee.Number(1)),1,1).advance(endJulian,'day');
  print(startDate,endDate)
  var shadowStartDate = startDate.advance(ee.Number(-1).multiply(ee.Number(shadowLookBack)),'year')
  var shadowEndDate = endDate.advance(ee.Number(shadowLookForward),'year')

  //Helper function to get images from a specified sensor
 function getCollection(sensor,startDate,endDate,startJulian,endJulian){
  var collectionName = collection_dict[sensor];
  
  //Start with an un-date-confined collection of iamges
  var WOD = ee.ImageCollection(collectionName)
          .filterBounds(fB)
          // .filter(ee.Filter.gt('google:registration_count', 1000))
          // .filter(ee.Filter.gt('google:registration_offset_x', -100))
          // .filter(ee.Filter.lt('google:registration_offset_x', 100))
          // .filter(ee.Filter.lt('google:registration_offset_y', 100))
          // .filter(ee.Filter.gt('google:registration_offset_y', -100))
          .map(ee.Algorithms.Landsat.TOA);
          
  //Pop off an image to serve as a template if there are no images in the date range
  var dummy = ee.Image(WOD.first())
  
  //Filter by the dates
  var ls = WOD
          .filterDate(startDate,endDate)
          .filter(ee.Filter.calendarRange(startJulian,endJulian))
  
  //Fill the collection if it's empty
  ls = fillEmptyCollections(ls,dummy);
  
  //Clean the collection up- clouds, fringes....
  ls = ls.map(maskCloudsAndSuch)
          .select(sensor_band_dict.get(sensor),bandNames)
  
  //Mask out snow and/or water if specified      
  // ls = ee.ImageCollection(ee.Algorithms.If(maskApply.contains('snow'),ls.map(maskSnow),ls));
  // ls = ee.ImageCollection(ee.Algorithms.If(maskApply.contains('water'),ls.map(maskWater),ls));
  return ls
 };
  
  
  //Get the images for composite and shadow model
  var l5s = ee.ImageCollection(ee.Algorithms.If(possibleSensors.contains('L5'),getCollection('L5',shadowStartDate,shadowEndDate,startJulian,endJulian),getCollection('L5',ee.Date('1000-01-01'),ee.Date('1001-01-01'),0,365)))
  var l7s = ee.ImageCollection(ee.Algorithms.If(possibleSensors.contains('L7'),getCollection('L7',shadowStartDate,shadowEndDate,startJulian,endJulian),getCollection('L7',ee.Date('1000-01-01'),ee.Date('1001-01-01'),0,365)))
  var l8s = ee.ImageCollection(ee.Algorithms.If(possibleSensors.contains('L8'),getCollection('L8',shadowStartDate,shadowEndDate,startJulian,endJulian),getCollection('L8',ee.Date('1000-01-01'),ee.Date('1001-01-01'),0,365)))
  
  //Merge the collections
  var ls = ee.ImageCollection(l5s.merge(l7s).merge(l8s)).map(addShadowSum)
  var shadowImageCount = ls.toList(100000,0).length()
  //Pop off an image to fill after date constriction for image range
  var dummy = ee.Image(ls.first())
  
  //Compute stats for dark pixels for shadow masking
  var meanShadowSum = ls.select(['shadowSum']).mean();
  var stdShadowSum = ls.select(['shadowSum']).reduce(ee.Reducer.stdDev());
  
  //Constrain collection to just the image date range
  var ls = ls.filterDate(startDate,endDate);
  var compositeImageCount = ls.toList(100000,0).length()
  //Fill it in case it's null
  ls = fillEmptyCollections(ls,dummy)
 
  //Apply z score shadow method
  ls = ls.map(function(img){return zShadowMask(img,meanShadowSum,stdShadowSum)})
  
  //Helper function for prioritizing images in compositing
  function prioritizeL5L8L7(ls,pctl,dummy){
    
    //Separate the collection back out
    var l5Composite = fillEmptyCollections(ls.filter(ee.Filter.metadata('system:index','contains','LT5')),dummy).reduce(reducer).select(bandNumbers,bandNames)
    var l7Composite = fillEmptyCollections(ls.filter(ee.Filter.metadata('system:index','contains','LE7')),dummy).reduce(reducer).select(bandNumbers,bandNames)
    var l8Composite = fillEmptyCollections(ls.filter(ee.Filter.metadata('system:index','contains','LC8')),dummy).reduce(reducer).select(bandNumbers,bandNames)
    
 
    //Find where there are data in each collection
    var l5msk =  l5Composite.mask()
    var l7msk = l7Composite.mask()
    var l8msk = l8Composite.mask()
    var msk = l5msk.or(l7msk).or(l8msk)
    
    //Fill back- L5,L8, and finally L7
    l5Composite = l5Composite.mask(ee.Image(1))
    l5Composite = l5Composite.where(l5msk.not().and(l8msk),l8Composite)
    l5Composite = l5Composite.where(l5msk.not().and(l8msk.not()),l7Composite)
    
    
    return ee.Image(l5Composite.mask(msk))
  }
  
  //Create composite either by just reducing, or by prioritizing and reducing
  var composite = ee.Image(ee.Algorithms.If(prioritizeL5.eq(1),
  prioritizeL5L8L7(ls,reducer,dummy),
  ls.reduce(reducer).select(bandNumbers,bandNames)))
  // var composite = ls.reduce(reducer).select(bandNumbers,bandNames)
  // var composite = ls.reduce(ee.Reducer.percentile([pctl])).select(bandNumbers,bandNames)
  
  var sDate = new Date(year,1,1)
  
  
  composite = addIndices(composite);
  composite = composite.set({'system:time_start':sDate.valueOf()})
  composite = composite.addBands(ee.Image(year).select([0],['year']).float())
  
  var ws = waterScore(composite);
  
  allImages = ee.ImageCollection(allImages.merge(ls))
  
  var fullName = saName+'_'+y1Image.toString()+'_' +y2Image.toString()+'_'+startJulian.toString()+'_'+endJulian.toString()
  var toExport = composite.select(['blue','green','red','nir','swir1','swir2']).multiply(10000).int16().clip(fB)
  //toExport = toExport.addBands(composite.select(['temp']).int16()).select([0,1,2,3,4,6,5]).clip(fB)
  // addToMap(toExport,{'min':0.2*10000,'max':0.4*10000,'bands':'swir2,nir,red'},'toExport')
   
   //Set up metadata
   var f = ee.Feature(toExport.geometry())
        .set('bandNames',toExport.bandNames())
        .set('DateStart',startDate)
        .set('DateEnd',endDate)
        .set('JulianStart',startJulian)
        .set('JulianEnd',endJulian)
        .set('CloudThresh',cloudThresh)
        .set('system:index',fullName)
        .set('CompositingMethod','Percentile')
        .set('CompositingParameters', '50')
        .set('PrioritizeL5',prioritizeL5)
        .set('Sensors',possibleSensors)
        .set('bufferCloudShadow',true)
        .set('imageCountComposite',compositeImageCount)
        .set('imageCountShadow',shadowImageCount)
        .set('crs',crs)
      
          .set('CloudShadowStart',shadowStartDate)
          .set('CloudShadowEnd',shadowEndDate)
          .set('Z_ShadowThresh',zShadowThresh)
    
     
   
  //Append the metadata if it already exists
   f = ee.FeatureCollection([f]);
   if(metadataFC === ''){metadataFC = f}
    else{metadataFC = metadataFC.merge(f)};
   
   
   //Add to map and export composite if compositing
   if(singleImageMode === false){
    addToMap(ws,{'min':0,'max':1,'palette':'000000,0000FF'},year.toString() + '_WaterScore',false)
    addToMap(composite,vizParams,year.toString() + '_composite',false)
    Export.image(toExport,fullName,{'scale':30,'maxPixels':1e13,'crs':crs,'region': region})
    return [composite,ws]}
  //Return images if running single image mode
  else{
    return allImages
  };
}
///////////////////////////////////////////////////////////////////
//Function to wrap methods to apply cloud/cloud-shadow masking to single image
//Pass function a Landsat EE image object, look forward days and look back days
//lookBack/lookForward = day of year buffer back/forward from image date to include for shadow masking
function singleImageMasking(image,lookBack,lookForward){

  //Get some info
  var info = image.getInfo();
  var id = info.properties['system:index']
 
  info = info.properties;
  var dts = info.DATE_ACQUIRED
  var path =info.WRS_PATH;
  var row = info.WRS_ROW;
  var zone =info.UTM_ZONE;
  var year = parseInt(dts.split("-",1)[0]);
  var region = image.geometry();
  fB = ee.FeatureCollection([ee.Feature(region)])
  var julian = parseInt(id.slice(13,16));
   
  
  //Helper functions to convert date objects to float year/date equivalent and visa versa
  var dateToProp = function(dt){return dt.valueOf()/365/3600/24/1000 + 1970};
  var propToDate = function(prop){return new Date((prop-1970)*365*3600*24*1000)};
  //Set up days of year

  var dtsd = new Date(dts);
  var dtFloat = dateToProp(dtsd);
  
  //Get dates to look for the other sensors available images
  
  var startDate = propToDate(dtFloat-lookBack/365);
  var endDate = propToDate(dtFloat+lookForward/365);
  var startJulian = julian-lookBack;
  var endJulian = julian + lookForward;
  if(startJulian < 0){startJulian = 365+startJulian};
  
  if(endJulian > 365){endJulian = endJulian - 365};
  var compositingPeriod = 1;

  //More info
  var spacecraft = info.SPACECRAFT_ID;
  var sensor = spacecraft_dict[spacecraft];
  var collection_name = collection_dict[sensor];
  var bands = sensor_band_dict[sensor];
  var forDisplay = image.select(sensor_band_dict.get('L8'),bandNames);

  addToMap(forDisplay,vizParams,'ImageWOMask_' + id)
  Map.centerObject(image,9);

  //Get collection of images with 
  var outImages =getImage(year,compositingPeriod,startJulian,endJulian,shadowLookBack,shadowLookForward,true)
  var outImage = ee.Image(outImages.filter(ee.Filter.equals('system:index',id)).first());
  addToMap(outImage,vizParams,'Masked_'+id);
};
/////////////////////////////////////////////////////////////////////////
//Compositing function call
// var composites = ee.ImageCollection(years.map(function(yr){return getImage(yr,compositingPeriod,startJulian,endJulian,shadowLookBack,shadowLookForward,false)}))
var l1 =getImage(2010,5,190,250,shadowLookBack,shadowLookForward,false)
var l2 = getImage(2015,1,210,300,shadowLookBack,shadowLookForward,false)

var dWaterScore = ee.Image(l1[1]).subtract(ee.Image(l2[1]))
addToMap(dWaterScore,{'min':-1,'max':0,'palette':'0000FF,000000'},'dWaterScore')
addToMap(dWaterScore.lt(-0.3),{'min':0,'max':1,'palette':'000000,0000FF'},'PossibleFlooding')
// var forVideo = composites.map(function(img){
//   return img.visualize(['swir1','nir','red'],null,null, 0.05, [.3,0.4,.4]);
// });
// Export.video(forVideo, 'example_video', {
//   dimensions: '720',
//   framesPerSecond: 0.75,
//   region: JSON.stringify(geometry.getInfo())});
  

Export.table(metadataFC, saName+'_Composites_Metadata')
addToMap(ee.Image().paint(fB,1,1), {'palette': '00FFFF'},'Study Area');



/////////////////////////////////////////////////////////////
//Single image masking mode
//var img = ee.Image('LC8_L1T_TOA/LC80060622013240LGN00');//Amazon
// var img = ee.Image('LC8_L1T_TOA/LC80410262013197LGN00');//Montana
// var img = ee.Image('LC8_L1T_TOA/LC80980632013245LGN00');//PNG
// var img = ee.Image('LC8_L1T_TOA/LC80610182014212LGN00');//Alaska/BC/Yukon
// var img = ee.Image('LC8_L1T_TOA/LC81950282014255LGN00');//Alps
// var img = ee.Image('LC8_L1T_TOA/LC81780602014184LGN00');//DRC
// var img = ee.Image('LC8_L1T_TOA/LC82310932014011LGN00');//Patagonia
// var img = ee.Image('LC8_L1T_TOA/LC81280462014058LGN00');//Laos
// var img = ee.Image('LC8_L1T_TOA/LC81280462014090LGN00');//Laos
// var img = ee.Image('LC8_L1T_TOA/LC80340342013180LGN00');//CO
// var singleImageLookBack = 32;//day of year buffer back from image date to include for shadow masking
// var singleImageLookForward = 32;//day of year buffer forward from image date to include for shadow masking
// singleImageMasking(img,singleImageLookBack,singleImageLookForward);