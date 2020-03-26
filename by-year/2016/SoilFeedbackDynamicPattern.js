/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.Polygon(
        [[[-89.6209716796875, 41.34382458118569],
          [-89.6429443359375, 39.66491373749131],
          [-87.3358154296875, 39.68605343225987],
          [-87.3797607421875, 41.35207214451295]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
////////////////////////////////////////////////////////////////////////
/*
PURPOSE:  
  the main script for Soil Feedback Dynamic Pattern in U.S.

MODIFICATION HISTORY:  
 Written by: Shanxin Guo , 2016-04-10, sx.guo@siat.ac.cn
*/
/////////////////////////////////////////////////////////////////////////////////////
var statisticFunction=function (Image)
{

  // Read in Matched layers
	var imgList =ee.List( Image.get("matchedID"));   
  var imageCollection=ee.ImageCollection(imgList);
  //Chenage the statistic methods by what you want.
  var sum=imageCollection.sum();

  return sum.copyProperties(Image, ['system:index', 'system:time_start', 'system:time_end']);
};
/////////////////////////////////////////////////////////////////////////////////////
//
var MovingWindowJoint =function(imageCollection,windowSize,mode)
{
  var primary = imageCollection;
  var secondary = imageCollection;

  //Define different timeFilters according modes
  var timeFilter=0;
  if(mode=='before')
  {
      timeFilter = ee.Filter.and(
        ee.Filter.maxDifference({
         difference: windowSize,
         leftField: 'system:time_end',
         rightField: 'system:time_end'
        }),
        ee.Filter.greaterThan({
         leftField: 'system:time_end',
         rightField: 'system:time_end'
        }));
  }
  else if(mode=='after')
  {
      timeFilter = ee.Filter.and(
        ee.Filter.maxDifference({
         difference: windowSize,
         leftField: 'system:time_end',
         rightField: 'system:time_end'
        }),
        ee.Filter.lessThan({
         leftField: 'system:time_end',
         rightField: 'system:time_end'
        }));
  }
  else if (mode=='middle')
  {
    timeFilter = ee.Filter.maxDifference({
         difference: windowSize,
         leftField: 'system:time_end',
         rightField: 'system:time_end'
        });
  }
  else
  {
    print("The mode your call doesn't exist!!");
  }

  //Define the join
  var saveAllJoin = ee.Join.saveAll({
     matchesKey: 'matchedID',
     ordering: 'system:time_start',
     ascending: true,
     measureKey: 'timeDiff'
  });
  
  // Apply the join.
  var joinedCollection = saveAllJoin.apply(primary, secondary, timeFilter);

  return joinedCollection.map(statisticFunction);
};

////////////////////////////////////////////////////////////////////////////////////////////
//calculate Daily ET0
// GRIDMET Daily ETo
// Constants
var pi = Math.PI;

// Read in/calculate ancillary layers
var elev = ee.Image("USGS/NED");
var lat = ee.Image.pixelLonLat().select('latitude').multiply(pi / 180);
var lon = ee.Image.pixelLonLat().select('longitude').multiply(pi / 180);

// Vapor Pressure in kPa with temperature in C
var vapor_pressure_func = function (t) {
  return t.expression('0.6108 * exp(17.27 * b() / (b() + 237.3))')};

var gridmet_eto_func = function (gridmet_image) {
  var scene_date = ee.Algorithms.Date(gridmet_image.get("system:time_start"));
  var doy = ee.Number(scene_date.getRelative('day', 'year')).add(1).double();
  //print(doy.getInfo());

  // Read in GRIDMET layers
	var tmin = gridmet_image.select(["tmmn"]);                  // K
	var tmax = gridmet_image.select(["tmmx"]);                  // K
	var ppt = gridmet_image.select(["pr"]);                     // mm
	var rhmin = gridmet_image.select(["rmin"]).multiply(0.01);  // % to decimal
	var rhmax = gridmet_image.select(["rmax"]).multiply(0.01);  // % to decimal
	var q = gridmet_image.select(["sph"]);                      // kg kg-1 ?
	var rs = gridmet_image.select(["srad"]).multiply(0.0864);   // W m-2 to MJ m-2 day-1
	var uz = gridmet_image.select(["vs"]);                      // m s-1
  var zw = 10.0;  // Windspeed measurement/estimated height (GRIDMET=10m)

  // Calculations
	var tmean = tmin.add(tmax).multiply(0.5).subtract(273.15);  // K to C
  // To match standardized form, psy is calculated from elevation based pair
  var pair = elev.expression('101.3 * pow((293 - 0.0065 * b()) / 293, 5.26)');
	var psy = pair.multiply(0.000665);
  var es_tmax = vapor_pressure_func(tmax.subtract(273.15));  // K to C
  var es_tmin = vapor_pressure_func(tmin.subtract(273.15));  // K to C
  var es_tmean = vapor_pressure_func(tmean);
  var es_slope = es_tmean.expression(
    '4098 * es / (pow((t + 237.3), 2))', {'es':es_tmean, 't':tmean});
	var es = es_tmin.add(es_tmax).multiply(0.5);

  // Vapor pressure from RHmax and RHmin (Eqn 11)
  //var ea = es_tmin.multiply(rhmax).add(es_tmax.multiply(rhmin)).multiply(0.5); 

  // Vapor pressure from specific humidity (Eqn )
  // To match standardized form, ea is calculated from elevation based pair
  var ea = pair.expression('q * pair / (0.622 + 0.378 * q)', {'pair':pair, 'q':q});

  // Extraterrestrial radiation (Eqn 24, 27, 23, 21)
  var delta = ee.Image.constant(
    doy.multiply(2 * pi / 365).subtract(1.39435).sin().multiply(0.40928));
	var omegas = lat.expression(
    'acos(-tan(lat) * tan(delta))', {'lat':lat, 'delta':delta});
  var theta = omegas.expression(
    'omegas * sin(lat) * sin(delta) + cos(lat) * cos(delta) * sin(b())',
    {'omegas':omegas, 'lat':lat, 'delta':delta});
  var dr = ee.Image.constant(
    doy.multiply(2 * pi / 365).cos().multiply(0.033).add(1));
	var ra = theta.expression(
    '(24 / pi) * gsc * dr * theta',
    {'pi':pi, 'gsc':4.92, 'dr':dr, 'theta':theta});

  // Simplified clear sky solar formulation (Eqn 19)
	//var rso = elev.expression(
  //  '(0.75 + 2E-5 * elev) * ra', {'elev':elev, 'ra':ra});

  // This is the full clear sky solar formulation
  // sin of the angle of the sun above the horizon (D.5 and Eqn 62)
  var sin_beta_24 = lat.expression(
    'sin(0.85 + 0.3 * lat * sin(delta) - 0.42 * lat ** 2)',
    {'lat':lat, 'delta':ee.Image.constant(doy.multiply(2 * pi / 365).subtract(1.39435))});
  // Precipitable water (Eqn D.3)
  var w = pair.expression('0.14 * ea * pair + 2.1', {'pair':pair, 'ea':ea});    
  // Clearness index for direct beam radiation (Eqn D.2)
  // Limit sin_beta >= 0.01 so that KB does not go undefined
  var kb = pair.expression(
    '0.98 * exp((-0.00146 * pair) / (kt * sin_beta) - 0.075 * pow((w / sin_beta), 0.4))',
    {'pair':pair, 'kt':1.0, 'sin_beta':sin_beta_24.max(0.01), 'w':w});
  // Transmissivity index for diffuse radiation (Eqn D.4)
  var kd = kb.multiply(-0.36).add(0.35)
    .min(kb.multiply(0.82).add(0.18));
  //var kd = kb.multiply(-0.36).add(0.35)
  //  .where(kb.lt(0.15), kb.multiply(0.82).add(0.18));
  // (Eqn D.1)
  var rso = ra.multiply(kb.add(kd));

  // Cloudiness fraction (Eqn 18)
	var fcd = rs.divide(rso).clamp(0.3,1).multiply(1.35).subtract(0.35);

  // Net long-wave radiation (Eqn 17)
  var rnl = ea.expression(
		'4.901E-9 * fcd * (0.34 - 0.14 * sqrt(ea)) * (pow(tmax, 4) + pow(tmin, 4)) / 2',
		{'ea':ea, 'fcd':fcd, 'tmax':tmax, 'tmin':tmin});

  // Net radiation (Eqns 15 and 16)
	var rn = rs.multiply(0.77).subtract(rnl);

  // Wind speed (Eqn 33)
	var u2 = uz.expression('b() * 4.87 / log(67.8 * zw - 5.42)', {'zw':zw});

  // Daily ETo (Eqn 1)
	var eto_day = gridmet_image.expression(
		('(0.408 * slope * (rn - g) + (psy * cn * u2 * (es - ea) / (t + 273))) / '+
     '(slope + psy * (cd * u2 + 1))'),
		{'slope':es_slope, 'rn':rn, 'g':0, 'psy':psy, 'cn':900,
     't':tmean, 'u2':u2, 'es':es, 'ea':ea, 'cd':0.34});

	return eto_day.select([0], ['ETo']).copyProperties(
    gridmet_image, ['system:index', 'system:time_start', 'system:time_end']);
};
////////////////////////////////////////////////////////////////////////////////////////
//Calculate Day after rain and the last precipitation
var CalculateDayOfRain= function(image){

    var DayAfterRain=image.expression(
    'B1+B2+B3+B4+B5+B6+B7',{
      B1:image.select(0).eq(0),
      B2:image.select(1).eq(0),
      B3:image.select(2).eq(0),
      B4:image.select(3).eq(0),
      B5:image.select(4).eq(0),
      B6:image.select(5).eq(0),
      B7:image.select(6).eq(0),
    });

    image=image.addBands(DayAfterRain);
    
   var Precipition=DayAfterRain.multiply(-1);
  Precipition=Precipition.where(Precipition.eq(0),image.select(0));
  Precipition=Precipition.where(Precipition.eq(-1),image.select(1));
  Precipition=Precipition.where(Precipition.eq(-2),image.select(2));
  Precipition=Precipition.where(Precipition.eq(-3),image.select(3));
  Precipition=Precipition.where(Precipition.eq(-4),image.select(4));
  Precipition=Precipition.where(Precipition.eq(-5),image.select(5));
  Precipition=Precipition.where(Precipition.eq(-6),image.select(6));
  Precipition=Precipition.where(Precipition.eq(-7),ee.Image(-1));
  
   image=image.addBands(Precipition);
  return image;
};
/////////////////////////////////////////////////////////////////////////////////////////
//Calculate cumulatied ETo
var CalculateCumulatedETo=function(image){
  var cumulatedETo=ee.Image(0);
  cumulatedETo=cumulatedETo.where(image.select('DayAfterRain').eq(1),image.select(0));
  cumulatedETo=cumulatedETo.where(image.select('DayAfterRain').eq(2),image.select(1));
  cumulatedETo=cumulatedETo.where(image.select('DayAfterRain').eq(3),image.select(2));
  cumulatedETo=cumulatedETo.where(image.select('DayAfterRain').eq(4),image.select(3));
  cumulatedETo=cumulatedETo.where(image.select('DayAfterRain').eq(5),image.select(4));
  cumulatedETo=cumulatedETo.where(image.select('DayAfterRain').eq(6),image.select(5));
  cumulatedETo=cumulatedETo.where(image.select('DayAfterRain').eq(7),image.select(6));
  cumulatedETo=cumulatedETo.where(image.select('DayAfterRain').eq(0),image.select(9).multiply(0.4));
  image=image.addBands(cumulatedETo);
  return image;
}
//////////////////////////////////////////////////////////////////////////////////
//MODIS data preprocessing
var getQABits = function(image, start, end, newName) {
    // Compute the bits we need to extract.
    var pattern = 0;
    for (var i = start; i <= end; i++) {
       pattern += Math.pow(2, i);
    }
    // Return a single band image of the extracted QA bits, giving the band
    // a new name.
    return image.select([0], [newName])
                  .bitwiseAnd(pattern)
                  .rightShift(start);
};

// A function to mask out pixels that did not have observations.
var maskEmptyPixels = function(image) {
  // Find pixels that had observations.
  var withObs = ee.Image(image).select('num_observations_1km').gt(0);
  return ee.Image(image).updateMask(withObs);
};

// A function to mask out cloudy pixels.
var maskClouds = function(image) {
  // Select the QA band.
  var QA = ee.Image(image).select('state_1km');
  // Get the internal_cloud_algorithm_flag bit.
  var internalCloud = getQABits(QA, 10, 10, 'internal_cloud_algorithm_flag');
  // Return an image masking out cloudy areas.
  return ee.Image(image).updateMask(internalCloud.eq(0));
};

var Joint =function(primary,secondary)
{

  var windowSize= 0.5 * 24 * 60 * 60 * 1000;
  //Define different timeFilters according modes
  var timeFilter = ee.Filter.maxDifference({
         difference: windowSize,
         leftField: 'system:time_end',
         rightField: 'system:time_end'
        });

  //Define the join
  var saveAllJoin = ee.Join.saveAll({
     matchesKey: 'matchedID',
     ordering: 'system:time_start',
     ascending: true,
     measureKey: 'timeDiff'
  });
  
  // Apply the join.
  var joinedCollection = saveAllJoin.apply(primary, secondary, timeFilter);
  return joinedCollection;
};

var combineGAGQ = function(image)
{
  var TempGQ=ee.List(image.get('matchedID'));
  var imageCollection=ee.ImageCollection(TempGQ);
  image=ee.Image(image).addBands(imageCollection.first());
  return image;
};
// mask non-bare soil pixels
var GetRidOfNonSoilPixels= function(image){
  var NDVI= ee.Image(image).normalizedDifference(["Band4","Band3"]).lt(0.30);
  var MNDWI= ee.Image(image).normalizedDifference(["Band2","Band4"]).lt(0);
  var Band1Mask = ee.Image(image).expression(
    "B1 >300 and B2 >300 and B3>0 and B4>0 and B5>0 and B6>0 and B7>0",
         {B1:ee.Image(image).select("Band1"),
           B2:ee.Image(image).select("Band2"),
           B3:ee.Image(image).select("Band3"),
           B4:ee.Image(image).select("Band4"),
           B5:ee.Image(image).select("Band5"),
           B6:ee.Image(image).select("Band6"),
           B7:ee.Image(image).select("Band7")

         });
  image=ee.Image(image).updateMask(NDVI);
  image=ee.Image(image).updateMask(MNDWI);
  image=ee.Image(image).updateMask(Band1Mask);
  return image;
};
// mask the unvalid rain event pixels
var MaskUnvalidRainEvent= function(image)
{
   var rainmask= ee.Image(image).select("LastPrecip").gt(12.7);
   var imagemask= ee.Image(image).select("Band7");
   image=ee.Image(image).addBands(ee.Image(image).select("CumulatedETo").sqrt());
   image=ee.Image(image).updateMask(rainmask);
   image=ee.Image(image).updateMask(imagemask);
   return image;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
//Main
//Load ImageCollection
var  date1 = '2000-01-01';
var  date2 = '2008-01-03';
var collection = ee.ImageCollection('NASA/ORNL/DAYMET').filterDate(date1, date2).filterBounds(geometry);
var doy_filter = ee.Filter.calendarRange(87,151, 'day_of_year');
var sub_collection = collection.filter(doy_filter).select([1]);
var gridmet_coll = ee.ImageCollection('IDAHO_EPSCOR/GRIDMET')
  .filterDate(date1, date2).filterBounds(geometry).filter(doy_filter);
  
// Calculate Day after Rain and Last Precipitation
// Define an allowable time difference: two days in milliseconds.
var OneDay = 1 * 24 * 60 * 60 * 1000;
var TwoDay = 2 * 24 * 60 * 60 * 1000;
var ThreeDay = 3 * 24 * 60 * 60 * 1000;
var FourDay = 4 * 24 * 60 * 60 * 1000;
var FiveDay = 5 * 24 * 60 * 60 * 1000;
var SixDay = 6 * 24 * 60 * 60 * 1000;
var SevenDay = 7 * 24 * 60 * 60 * 1000;

var StatiLayer1=MovingWindowJoint(sub_collection,OneDay,'before');
var StatiLayer2=MovingWindowJoint(sub_collection,TwoDay,'before');
var StatiLayer3=MovingWindowJoint(sub_collection,ThreeDay,'before');
var StatiLayer4=MovingWindowJoint(sub_collection,FourDay,'before');
var StatiLayer5=MovingWindowJoint(sub_collection,FiveDay,'before');
var StatiLayer6=MovingWindowJoint(sub_collection,SixDay,'before');
var StatiLayer7=MovingWindowJoint(sub_collection,SevenDay,'before');

var CombinedCollection_Daymet=ee.ImageCollection(StatiLayer1).combine(StatiLayer2).combine(StatiLayer3).combine(StatiLayer4).combine(StatiLayer5).combine(StatiLayer6).combine(StatiLayer7);

// Calculate daily Day after Rain and Last precipitation
var DAR_LP=CombinedCollection_Daymet.map(CalculateDayOfRain).select([7,8],['DayAfterRain','LastPrcip']);

// Calculate daily ETo 
var EToCollection = gridmet_coll.map(gridmet_eto_func);

// Calculate daily cumulated ETo
var EToCumulated_1Day=MovingWindowJoint(EToCollection,OneDay,'before');
var EToCumulated_2Day=MovingWindowJoint(EToCollection,TwoDay,'before');
var EToCumulated_3Day=MovingWindowJoint(EToCollection,ThreeDay,'before');
var EToCumulated_4Day=MovingWindowJoint(EToCollection,FourDay,'before');
var EToCumulated_5Day=MovingWindowJoint(EToCollection,FiveDay,'before');
var EToCumulated_6Day=MovingWindowJoint(EToCollection,SixDay,'before');
var EToCumulated_7Day=MovingWindowJoint(EToCollection,SevenDay,'before');

var CombinedCollection_ETo=ee.ImageCollection(EToCumulated_1Day).combine(EToCumulated_2Day).combine(EToCumulated_3Day).combine(EToCumulated_4Day).combine(EToCumulated_5Day).combine(EToCumulated_6Day).combine(EToCumulated_7Day).combine(DAR_LP).combine(EToCollection);
var CumulatedETo=CombinedCollection_ETo.map(CalculateCumulatedETo).select([7,8,10],['DayAfterRain','LastPrecip','CumulatedETo']);


//MODIS prepocessing
var collectionGQ = ee.ImageCollection('MODIS/MOD09GQ').filterDate(date1, date2).filterBounds(geometry);
var GQ = collectionGQ.filter(doy_filter).select([1,2]);
var collectionGA = ee.ImageCollection('MODIS/MOD09GA').filterDate(date1, date2).filterBounds(geometry);
var GA = collectionGA.filter(doy_filter).select([0,1,12,13,14,15,16]);

//joint MODIS GA with GQ
var CombinationGAGQ=Joint(GA,GQ);
//combine to one imagecollection
var GAGQ=CombinationGAGQ.map(combineGAGQ);
//mask empty pixels and clouds
var GAGQ2=GAGQ.map(maskEmptyPixels);
var GAGQCloudFree=GAGQ2.map(maskClouds);
//re-arrange the bands with electromagnetic order
GAGQCloudFree=ee.ImageCollection(GAGQCloudFree).select([2,3,7,8,4,5,6],['Band1','Band2','Band3','Band4','Band5','Band6','Band7'])
//select bare soil pixel
var GAGQSoil=ee.ImageCollection(GAGQCloudFree).map(GetRidOfNonSoilPixels);

// Linear regression between sqrt(CETo) and log(band7)
var LnBand7=ee.ImageCollection(GAGQSoil).select('Band7').map(function(image){
  return ee.Image(image).log();
});
var CombinationB7CET=Joint(LnBand7,CumulatedETo);
var tempCollection=CombinationB7CET.map(combineGAGQ);
var regressionset=ee.ImageCollection(tempCollection.map(MaskUnvalidRainEvent)).select(["CumulatedETo_1","Band7"],["CETsqrt","Band7"]);

var fit=regressionset.reduce(
  ee.Reducer.linearFit());
//var coefficImage = linearRegression.select(['coefficients']).arrayFlatten(bandNames);
//print(regressionset);



//visualization
var ET_PALETTE = ('F5F5DC, D2B48C, 40E0D0, 80FF00, 006400, 0000FF');
Map.addLayer(fit,
  {min: 0, max: [-0.9, 8e-5, 1], bands: ['scale', 'offset', 'scale']}, 'fit');
//Map.addLayer(ee.Image(regressionset.toList(100).get(10)).normalizedDifference(["Band2","Band4"]),{min:-1, max:1,palette:ET_PALETTE},'NDWI')
//Map.addLayer(ee.Image(tempCollection.toList(100).get(10)).select("CumulatedETo"),{min:0, max:50,palette:ET_PALETTE},'CET')
//Map.addLayer(ee.Image(regressionset.toList(100).get(10)).select("CETsqrt"),{min:0, max:20,palette:ET_PALETTE},'CET0.5')
//Map.addLayer(ee.Image(regressionset.toList(100).get(10)).select(1),{min:0, max:3,palette:ET_PALETTE},'LB7')
//Map.addLayer(regressionset.count().select(0),{min:0, max:20,palette:ET_PALETTE},'BareSoil');
//Map.addLayer(ee.Image(tempCollection.toList(100).get(10)).select("LastPrecip"),{min:0, max:30,palette:ET_PALETTE},'Prcip')
//Map.addLayer(ee.Image(GAGQCloudFree.toList(100).get(5)),{bands: 'Band4,Band3,Band2',min:0, max:10000},'Color Image')
//Map.addLayer(ee.Image(GAGQCloudFree.toList(100).get(5)),{bands: 'Band3,Band2,Band1',min:0, max:10000},'True Image')
centerMap(-88.77, 40.81, 8);
