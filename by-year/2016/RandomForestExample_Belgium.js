/***

 * GEE WUDAPT's Local Climate Zones for Belgian cities
 * Framework to compare with Envi / Enmap (??) results of M.-L. Verdonck and M. Demuzere
 * Based on: https://developers.google.com/earth-engine/classification

 * INFO: enable Performance Profiling under gear icon (see here: https://goo.gl/ehJYhK)
***/

// Create color palette to display the LCZ classes.
var palette =['8c0000','d10000','ff0000','bf4d00',
              'ff6600','ff9955','faee05','bcbcbc',
              'ffccaa','555555','006a00','00aa00',
              '648525','b9db79','000000','fbf7ae','6a6aff'];
       
//  VARIOUS INPUTs

// City of Interest + Flags
//var city = 'Brussels';
//var city = 'Gent';
//var city = 'Antwerp';
//var city = 'Leuven';
var city = 'Belgium';

var kernel100 = false; // true: the default workflow for WUDAPT.
// Moving window options? 1, 2, 3, 4, 5, 6 (as pixels, expressed as radius)
var nbOn = false; var nbSize= 1 ; 
var accuracyOn = true;
var plotOn = false;
var saveOn = true;
var zooml=8;

// Satellite information
var bands = ['B1','B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B10', 'B11'];

// Define a region of interest 
// GEE has issues with the fact that the shape is a multipolygon.
// Hence we read is separately and merge it afterwards. => Does not work?
var roi_belgium = ee.FeatureCollection('ft:1zmGf_25WQeIr_vrTiQPEGJheOjfyQGo-jK757f23', 'geometry')
  .merge(ee.FeatureCollection('ft:1iSaD5S4i12JdtG-juANpM5XInCd0zj5O595S754K', 'geometry'))
  .merge(ee.FeatureCollection('ft:1bSNsvwbihqr-K1R1xbdc5wmXbYnJp5yrH1zj_KsT', 'geometry'));
var roi_br = ee.FeatureCollection('ft:1hpA9OGIGBmJdS8KcMUTVFw-btq-T4yC3q6NiJLRx', 'geometry');
var roi_ge = ee.FeatureCollection('ft:1noLxD_-j010V8S7QX3jswZLRUa1icec95S1lK_VR', 'geometry');
var roi_an = ee.FeatureCollection('ft:1SZba5pJcjwmQc9xc0NnI63Be21eScvLnrbY_tNPA', 'geometry');
var roi_le = ee.FeatureCollection('ft:1FS9kQPJ4BSU7vT8tW6P7FhLj17zhZrXSgEMDKVJZ', 'geometry');

// If polygons available as shapes, use this online tool: http://www.shpescape.com/
// Define training areas, remap class numbers for simplicity
var ta_br = ee.FeatureCollection('ft:1ATKuzpeuijn71a_ylcUYmSdzRQfWGV3rMr0d8oAt', 'geometry')
            .remap([1,2,3,4,5,6,7,8,9,10,101,102,103,104,105,106,107],
                  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], 'Class');
var ta_ge = ee.FeatureCollection('ft:1n6CsdLyRNzrbTuM1bbQw0-bfwWbC6aAK8iJigep_', 'geometry')
            .remap([1,2,3,4,5,6,7,8,9,10,101,102,103,104,105,106,107],
                  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], 'Class');
var ta_an = ee.FeatureCollection('ft:1NLpv5y7v80PRIjm-jtMlwebCAfVcQuUROg-ni4j4', 'geometry')
            .remap([1,2,3,4,5,6,7,8,9,10,101,102,103,104,105,106,107],
                  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], 'Class');
var ta_le = ee.FeatureCollection('ft:1fbrWZw4vXHIJxRaqD6wWIpjoRp5pGEEzodac7FDP', 'geometry')
            .remap([1,2,3,4,5,6,7,8,9,10,101,102,103,104,105,106,107],
                  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], 'Class');

// Define validation areas
var va_br = ee.FeatureCollection('ft:1J69zSaIN5BlTADOtC4tuFExiXb_6zyABu5_bXYzI', 'geometry')
            .remap([1,2,3,4,5,6,7,8,9,10,101,102,103,104,105,106,107],
                  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], 'Class');
var va_ge = ee.FeatureCollection('ft:1y9ooBWXVhU2sqRXjoC9rjejLTyhrJsCXjzeQxf3q', 'geometry')
            .remap([1,2,3,4,5,6,7,8,9,10,101,102,103,104,105,106,107],
                  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], 'Class');
var va_an = ee.FeatureCollection('ft:1_peDwNau9wRYTUA05ufbaae0PIcdf2Ejs5XE-5sL', 'geometry')
            .remap([1,2,3,4,5,6,7,8,9,10,101,102,103,104,105,106,107],
                  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], 'Class');
var va_le = ee.FeatureCollection('ft:1-1at9L6Wgjy3U56QnsFCd9rJ4HRc-cPOJYrocfzh', 'geometry')
            .remap([1,2,3,4,5,6,7,8,9,10,101,102,103,104,105,106,107],
                  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], 'Class');


// City/Area of Interest?
if (city == 'Brussels') {
  var roi = roi_br;
  var ta_poly = ta_br; 
  var va_poly = va_br;
  var lonv= 4.35; var latv = 50.83;
  var L1 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980252014068LGN00');
  var L2 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980252014212LGN00');
  var L3 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980252014260LGN00');
  var L4 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980252014276LGN00');
  var Lcomb = L1.addBands(L2).addBands(L3).addBands(L4).select(bands);
} else if (city == 'Gent') {
  var roi = roi_ge;
  var ta_poly = ta_ge;
  var va_poly = va_ge;
  var lonv= 3.754; var latv = 51.1;
  var L1 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980252015071LGN00');
  var L2 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980252015215LGN00');
  var L3 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980242015343LGN00');
  var L4 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81990242015254LGN00');
  var Lcomb = L1.addBands(L2).addBands(L3).addBands(L4).select(bands);
} else if (city == 'Antwerp') {
  var roi = roi_an;
  var ta_poly = ta_an;
  var va_poly = va_an;
  var lonv= 4.4178; var latv = 51.2087;
  var L1 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980242015071LGN00');
  var L2 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980242015215LGN00');
  var L3 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980242015343LGN00');
  var L4 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81990242015254LGN00');
  var L5 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81990242015270LGN00');
  var Lcomb = L1.addBands(L2).addBands(L3).addBands(L4).addBands(L5).select(bands);
} else if (city == 'Leuven') {
  var roi = roi_le;
  var ta_poly = ta_le;
  var va_poly = va_le;
  var lonv= 4.7004; var latv = 50.8789;
  var L1 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980252013273LGN00');
  var L2 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980252014068LGN00');
  var L3 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980252014212LGN00');
  var L4 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980252014260LGN00');
  var L5 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980252014276LGN00');
  var L6 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980252015071LGN00');
  var Lcomb = L1.addBands(L2).addBands(L3).addBands(L4).addBands(L5).addBands(L6).select(bands);
} else { // option for the whole of Belgium
  var roi = roi_belgium;
  var ta_poly = ta_le.merge(ta_br).merge(ta_ge).merge(ta_an);
  var va_poly = va_le.merge(va_br).merge(va_ge).merge(va_an);
  var lonv= 4.616368; var latv = 50.6165;

  var col_DJF = ee.ImageCollection('LANDSAT/LC8_L1T_TOA_FMASK')
    .filter(ee.Filter.calendarRange(336,60,'day_of_year'))
    .filterBounds(roi);
  var col_MAM = ee.ImageCollection('LANDSAT/LC8_L1T_TOA_FMASK')
    .filter(ee.Filter.calendarRange(61,152,'day_of_year'))
    .filterBounds(roi);
  var col_JJA = ee.ImageCollection('LANDSAT/LC8_L1T_TOA_FMASK')
    .filter(ee.Filter.calendarRange(153,244,'day_of_year'))
    .filterBounds(roi);
  var col_SON = ee.ImageCollection('LANDSAT/LC8_L1T_TOA_FMASK')
    .filter(ee.Filter.calendarRange(245,335,'day_of_year'))
    .filterBounds(roi);

  var imgDJF = col_DJF.map(cloudmask).median();
  var imgMAM = col_MAM.map(cloudmask).median();
  var imgJJA = col_JJA.map(cloudmask).median();
  var imgSON = col_SON.map(cloudmask).median();

  // Combine 
  var Lcomb = imgMAM.addBands(imgJJA).addBands(imgSON).select(bands); // Exclude DJF
  //var Lcomb = imgMAM.addBands(imgJJA).addBands(imgSON).addBands(imgDJF).select(bands);
}

// Cloud function
function cloudmask(img) {
  var msk = img.select('fmask').eq(ee.Image(0));
  return img.updateMask(msk);
}
  
// Define a kernel for the 100m resolution
if (kernel100) {
  var boxcar = ee.Kernel.square({
    radius: 50, units: 'meters'
  });
  var kernelImage = Lcomb.convolve(boxcar);
}

// Define the moving windows with 6 additional statistics:
// std, min, 25/75th percentile, median, mean and max.
if (nbOn) {
  var kernel = ee.Kernel.square({radius: nbSize, units: 'pixels'});
  
  var imStd = Lcomb.reduceNeighborhood({
    reducer: ee.Reducer.stdDev(),
    kernel: kernel,
  });
  
  var imPer = Lcomb.reduceNeighborhood({
    reducer: ee.Reducer.percentile([0,25,50,75,100],['0','25','50','75','100']),
    kernel: kernel,
  });
  
  var imMean = Lcomb.reduceNeighborhood({
  reducer: ee.Reducer.mean(),
  kernel: kernel,
  });
}

// Set final image to work with
if (kernel100) {
  var kernelset = '100m_';
  var finalImage = kernelImage;
} else if (nbOn){
  var kernelset = nbSize.toString()+'_';
  var finalImage = Lcomb.addBands(imStd).addBands(imPer).addBands(imMean);
} else {
  var kernelset = '30m_';
  var finalImage = Lcomb;
}

print(finalImage);

//   CLASSIFICATION
var training = finalImage.sampleRegions({collection: ta_poly, properties: ['Class'], scale: 30});
var validation = finalImage.sampleRegions({collection: va_poly, properties: ['Class'], scale: 30});

// Make a Random Forest classifier and train it.
// This uses all pixels in all images.
var classifier = ee.Classifier.randomForest(100).train(training, 'Class');

// Classify all images into LCZ map
var LCZmap = finalImage.classify(classifier);


//   MAP
Map.setCenter(lonv,latv,zooml);      
Map.addLayer(LCZmap.clip(roi), {min: 0, max: 16, palette: palette}, 'LCZ');
Map.addLayer(ta_poly,{'color':'800080'},'Training polygons');
Map.addLayer(va_poly,{'color':'FFFF00'},'Validation polygons');

if (nbOn) {
  Map.addLayer(finalImage.clip(roi), {bands: ['B4_stdDev', 'B3_stdDev', 'B2_stdDev'], max: 0.03}, 'std');
  Map.addLayer(finalImage.clip(roi), {bands: ['B4_100', 'B3_100', 'B2_100'], max: 0.3}, 'max');
}


//   ACCURACY
if (accuracyOn) {
  var lcode = ee.List(['1','2','3','4','5','6','7','8','9','10','A','B','C','D','E','F','G']); // labels
  // Classify the validation data.
  var validated = validation.classify(classifier);
  
  // Get a confusion matrix representing expected accuracy.
  var cm = validated.errorMatrix('Class', 'classification');
  var oa =  cm.accuracy(); 
  var oap = oa.toString();
  var ua = cm.consumersAccuracy().project([1]);
  var pa = cm.producersAccuracy().project([0]);
  var f1 = (ua.multiply(pa).multiply(2.0)).divide(ua.add(pa)) ;
  var f1p = f1.multiply(1000).round().divide(10).toList();
  var kappa = cm.kappa();
  
  //print("Overall Accuracy:", oa); 
  //print("Class-Wide F1 statistic:",f1p);
  //print("kappa:", kappa);
  //print("User's Accuracy:", ua);
  //print("Producer's Accuracy:", pa);
  
  var statistics = ee.Feature(null, {
    OA: oa,
    F1: f1p,
    UA: ua.toList(),
    PA: pa.toList(),
    KAPPA: kappa
  });
}

//  PLOT INTERACTIVELY 

if (plotOn) {
  
  // Chart of the accuracy
  var chart = ui.Chart.array.values(f1p, 0, lcode)
    .setOptions({
      title: 'Overall Accuracy: '+ oap,
      hAxis: {'title': 'F1 Measure'},
      vAxis: {'title': 'LCZ class'},
      legend: null 
  });
  
  chart = chart.setChartType('BarChart');
  print(chart);
}

//  SAVE ITEMS TO DRIVE

if (saveOn) {
  // Export the statistics to table
  Export.table.toDrive({
    collection: ee.FeatureCollection(statistics),
    description: 'LCZ_stats_' + kernelset + city,
    folder: 'exports',
    fileFormat: 'CSV'
  });
  
  //Export the map
  Export.image.toDrive({
    image: LCZmap.clip(roi),
    description: 'LCZ_map_' + kernelset + city,
    folder: 'exports',
    scale: 30,
    maxPixels: 1e11
  });

}

