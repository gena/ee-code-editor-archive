// ModisCalculateSnowCoverFrequency20160128

function CreateDateRanges(startDateString, duration, durationUnit, intermittence, intermittenceUnit,numOfZones) {
  var startDate=ee.Date(startDateString)
  // construct temporal zones as DateRanges
  var dateRanges=[];
  
  for(var i=0; i<numOfZones; i++) {
    var d1=startDate.advance(i*duration,durationUnit).advance(i*intermittence,intermittenceUnit);
    var d2=d1.advance(duration,durationUnit);
    dateRanges.push(ee.DateRange(d1,d2));
  }
  return ee.List(dateRanges); //return a ee.List
}

//
// Function to apply a reducer/stat to temporal zones
//
function TemporalZoneStats(collection,tzDateRanges,reducer) {
  var imList = tzDateRanges.map(function(dRange){ 
    var ic=collection.filterDate(dRange); 
    //print('ic scale',ee.Image(ic.first()).projection().nominalScale().getInfo());
    var im = ic.reduce(reducer)
    
    //add date range to the image!
    im = im.set({"system:time_start": ee.DateRange(dRange).start()})
    im = im.set({"system:time_end": ee.DateRange(dRange).end()})
    
    return im;
  });
  
  //print('TemporalZoneStats() scale',ee.Number(ee.Image(imList[0]).projection().nominalScale()));
  //Image collection reducer always "thinks" the scale of the output image is 1-degree.
  //See script "Pitfalls_ImageCollectionReduceScaleIssue"
  
  return ee.ImageCollection(imList)
}

//
// Calculate snow cover frequency
//

//
// A more generall function to calculate the frequency (days) of a certain landcover in time
//
var LandCoverFrequency = function(landCover, bandName, landcoverVals, otherLandcoverVals){
  //landcoverVals--list of landcover values that will be reclassified as 1
  //otherLandcoverVals--list of landcove values that will be reclassified as 0
  
  var inVals = landcoverVals.concat(otherLandcoverVals);
  //print(inVals);

  var numOfLvs = landcoverVals.length;
  var numOfOlvs = otherLandcoverVals.length;
  var outLvs=[];
  var outOlvs=[];
  for(var i=0; i<numOfLvs; i++) {outLvs.push(1)}
  for(var i=0; i<numOfOlvs; i++) {outOlvs.push(0)}
  var outVals = outLvs.concat(outOlvs);
  //print(outVals);
  
  // run a map function to reclassify snow cover
  var binaryLandcover = landCover.map(function(anImage) {
    return anImage.remap(inVals,    // Original pixel values snow, nosnow, cloud, null
                         outVals,   // Reclassified values: 1--snow/ice; 0--no snow/ice
                         null,      // All other MODIS snow product pixel values (0, 1, 11, 50, 254, 255)
                         bandName);
  });
    
  // Calculate the number of days with snow cover
  var NumOfTrueDays =  binaryLandcover.sum()
                               
  // Calculate the number of days with valid observation, i.e., snow or no snnow
  var NumOfValidObsDays = binaryLandcover.count();
                                   
  
  // Calculate snow cover frequency
  var landCoverFrequency = (NumOfTrueDays.toFloat().divide(NumOfValidObsDays));
  
  return landCoverFrequency;
}

//
// Calculate MODIS snow cover frequency within temporal zones
//
var CalculateModisSnowCoverFrequency = function(modisSnow, startDates, endDates){
  var scfImages = [];

  for (var i = 0; i < startDates.length; i++) { 
    //print(i);
    var sc = ee.ImageCollection(modisSnow).select('Snow_Cover_Daily_Tile')
                                              .filterDate(startDates[i], endDates[i])
    
    var scf = LandCoverFrequency(sc, 'Snow_Cover_Daily_Tile', [200], [25]); //MODIS snow=200, nosnow=25
    // or
    //var scf = LandCoverFrequency(mod10a1, 'Snow_Cover_Daily_Tile', [100, 200], [25,37,39]);
  
    // Add a time stamp here?
    //var waterYearScfImage =  ee.Image(new Date(waterYearEndDates[i]).getFullYear())
    //        .addBands(scf.select(['remapped'], ['Snow Cover Frequency'])).toDouble();
    
    scfImages.push(scf);
  }

  return scfImages;
}

function TemporalZoneSnowCoverFrequency(collection,tzDateRanges) {
  var imList = tzDateRanges.map(function(dRange){ 
    var ic=collection.select('Snow_Cover_Daily_Tile').filterDate(dRange); 
    var im = LandCoverFrequency(ic, 'Snow_Cover_Daily_Tile', [200], [25]); //MODIS snow=200, nosnow=25
   
    //add date range to the image!
    im = im.set({"system:time_start": ee.DateRange(dRange).start()})
    im = im.set({"system:time_end": ee.DateRange(dRange).end()})
    
    return im;
  });
  
  //print('TemporalZoneStats() scale',ee.Number(ee.Image(imList[0]).projection().nominalScale()));
  //Image collection reducer always "thinks" the scale of the output image is 1-degree.
  //See script "Pitfalls_ImageCollectionReduceScaleIssue"
  
  return ee.ImageCollection(imList)
}


// craate calendar year temporal zones
var hydroYearRanges=CreateDateRanges('2000-10-01',1,'year',0,'year',15); //2000-2012 hydro years
hydroYearRanges=CreateDateRanges('2000-10-01',1,'month',0,'month',12)
print('Hydro year date ranges',hydroYearRanges);

var IMAGE_COLLECTION_ID = 'MOD10A1'
var mod10A1 =  ee.ImageCollection(IMAGE_COLLECTION_ID);
var scf = TemporalZoneSnowCoverFrequency(mod10A1, hydroYearRanges)
print('Hydr year SCF', scf);

var SCF_COLLECTION = scf.select(['remapped'],['scf']) //change band name
print('Name changed',SCF_COLLECTION)

//fit a linear regression
// Add a band containing image date as years since 2000.
function CreateTimeBand(img){
    var year = ee.Date(img.get('system:time_start')).get('year').subtract(2000);
    return ee.Image(year).byte().addBands(img);
}
var scfWithTime = SCF_COLLECTION.map(CreateTimeBand);
Map.addLayer(scfWithTime,{},'SCF',false);

var fit = scfWithTime.reduce(ee.Reducer.linearFit());
print('Linear fit',fit);

//add the the map
//Map.addLayer(fit, {'min': '0', 'max': '0.18,20,-0.18','bands': 'scale,offset,scale',});
var Brown2Blue = ['964B00', 'A15F1C', 'AD7338', 'B98755', 'C49B71', 'D0AF8D', 'DCC3AA', 'E7D7C6', 'F3EBE2', 'FFFFFF',
                   'E7F1FA', 'CFE4F6', 'B7D7F2', '9FCAED', '88BDE9', '70B0E5', '58A3E0', '4096DC', '2989D8'];
                   
Map.addLayer(fit.select(['scale']), {min:-0.007, max:0.007, palette:Brown2Blue}, 'Linear Trend', true);

