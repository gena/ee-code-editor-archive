
/*#####################################################################################################################
Script:       Example KMeans and Otsu channel classification

Author:    Alex Bryk
Date Created :  2016/07/27
Institution: UC Berkeley

Purpose:    Example of the two ways I would like to classify channels globally
              

General Workflow:
    1) Solicit single image and compute NDVI
    2) Clip NDVI image using a canny edge detector to find channel boundaries. 
    3) wKMeans classifier
    4) Otsu thresholding classifier 
    5) For the Otsu method, filter out small water bodies using connected componnents labeler
    6) display
    7) Export


Notes: Ultimately, I would like to run this code for every WRS2 tile every year since 1984. I can start with a couple of good years. 
       I will have to clean the floodplain (probably manually) in many instances but there are only ~2000 landsat tiles and I will be able 
       to do this over a period of weeks

       I would like to use both methods (KMeans and Otsu)   
######################################################################################################################*/

// ====================================== //
//               Functions                //
// ====================================== // 

// NDVI function //
function NDVI_calc(input_image1) {
  var im_geom = input_image1.geometry().buffer(-4000);
      input_image1 = input_image1.clip(im_geom);
  var NDVI_calculated = input_image1.expression("(b('nir')-b('red'))/(b('nir')+b('red'))"); //
  var new_im = input_image1.addBands(NDVI_calculated.select([0],['NDVI']));
 return new_im;
}

// Otsu's thresholding method
function otsu(histogram) {
  var sumAll = function (a, start, end) {
      var sum = 0;
      for (var i = start; i < end; i++)
          sum += a[i];
      return sum;
  };

  var total = sumAll(histogram, 0, histogram.length);
  console.log(total)

  var sum = 0;
  for (var i = 1; i < histogram.length; ++i) {
      sum += i * histogram[i];
  }

  var sumB = 0;
  var wB = 0;
  var wF = 0;
  var mB;
  var mF;
  var max = 0.0;
  var between = 0.0;
  var threshold1 = 0.0;
  var threshold2 = 0.0;

  for (var j = 0; j < histogram.length; ++j) {
      wB += histogram[j];
      if (wB === 0)
          continue;

      wF = total - wB;
      if (wF === 0)
          break;
      sumB += j * histogram[j];
      mB = sumB / wB;
      mF = (sum - sumB) / wF;
      between = wB * wF * Math.pow(mB - mF, 2);
      if ( between >= max ) {
          threshold1 = j;
          if ( between > max ) {
              threshold2 = j;
          }
          max = between;            
      }
  }
  return ( threshold1 + threshold2 ) / 2.0;
}

//===========================================================================================================//
//===========================================================================================================//
// ====================================== //
//             Input Parameters           //
// ====================================== // 
var year = '2014';
var LC45_BANDS = ['B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B6']; 
var LC7_BANDS = ['B1',   'B2',    'B3',  'B4',   'B5',    'B7',    'B6_VCID_1'];
var LC8_BANDS = ['B2',   'B3',    'B4',  'B5',   'B6',    'B7',    'B10'];
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'temp'];
var zeros = ee.Image(0);
var ones = ee.Image(1);

//===========================================================================================================//
//===========================================================================================================//
// ====================================== //
//              Solicit data              //
// ====================================== // 

var image = ee.Image('LC8_L1T_TOA/LC81140262014088LGN00').select(LC8_BANDS,STD_NAMES); // Example image 1
// var image = ee.Image('LC8_L1T_TOA/LC81290132014161LGN00').select(LC8_BANDS,STD_NAMES); // Example image 2
var bounds = image.geometry()
    bounds = bounds.buffer(-4000);
Map.centerObject(image,11)


//===========================================================================================================//
//===========================================================================================================//
// ====================================== //
//         Set Display Parameters         //
// ====================================== //
var NDVI_IM = NDVI_calc(image).select('NDVI');
var Im_plot = NDVI_IM
print(NDVI_IM)
Map.addLayer(Im_plot.select('NDVI'),{min: 0, max: 1},'NDVI');   


//===========================================================================================================//
//===========================================================================================================//
// ====================================== //
//          Canny Edge Detector           //
// ====================================== // 

var clampLOW = 0;
var clampHIGH = 0.4;
var c_thresh = 0.8; // 1;
var sig = 1 ;// 1.5;
var canny_color = ['ff0000','ffffff'];

// Run Canny edge detector on the original NDVI image. 
var canny = ee.Algorithms.CannyEdgeDetector(Im_plot.clip(bounds), c_thresh, sig);
    canny = canny.mask(canny.gt(0));
    canny = canny.mask(canny).int32();
    canny = canny.where(canny.eq(0),ones);

  var canny_buffered = canny.focal_max(90, 'square', 'meters'); // Buffer edges to get at the channel boundaries including both low and high NDVI     

var canny_river_boundaries = zeros.where(canny_buffered,Im_plot);   // Clip original NDVI with buffered channel boundaries
    canny_river_boundaries = canny_river_boundaries.updateMask(canny_buffered);
    canny_river_boundaries = canny_river_boundaries.select(['constant'],['NDVI']);
    canny_river_boundaries = canny_river_boundaries.clip(bounds.buffer(-500))
    
Map.addLayer(canny,{min: 0, max: 1},'canny_edge',false);   
Map.addLayer(canny_river_boundaries.select('NDVI'),{min: 0, max: 1},'canny_river_boundaries',false);   

//===========================================================================================================//
//===========================================================================================================//
// ====================================== //
//     Create channel mask using KMeans   //
// ====================================== //

var training = canny_river_boundaries.sample({  // train the clusterer with the canny filtered channel boundaries
    region: bounds,
    scale: 30,
    numPixels: 5000});
    
// var clusterer = ee.Clusterer.wCascadeKMeans().train(training)  // Selects k based on calinski-harabasz criterion
// var clusterer = ee.Clusterer.wXMeans().train(training)  // Selects k based on Dan Pelleg et al. method.
var clusterer = ee.Clusterer.wKMeans(2).train(training); // chosen number of clusters
var result = Im_plot.cluster(clusterer);  // classify the original NDVI image

var channels = result.eq(1);
    channels = channels.mask(channels);

Map.addLayer(result.randomVisualizer(),{},'kMeans',false);
Map.addLayer(channels,{palette: '0fff00'},'kMeans_channels');


//===========================================================================================================//
//===========================================================================================================//
// ================================================== //
//     Create channel mask usingOtsu Thresholding     //
// ================================================== //

  // compute threshold using Otsu's method
  var ndvi_min = -0.3;
  var ndvi_max = 0.6;
  var ndvi_vis = {min: ndvi_min, max: ndvi_max};

  var ndvi_hist_info = canny_river_boundaries.reduceRegion({
  reducer: ee.Reducer.histogram(255),
  geometry: bounds,
  scale: 30,
  maxPixels: 1e13
}); 

    ndvi_hist_info = ndvi_hist_info.get('NDVI').getInfo();

var ndvi_hist = ndvi_hist_info['histogram'];
var ndvi_means = ndvi_hist_info['bucketMeans'];

print(ndvi_hist);
var threshold_index = otsu(ndvi_hist);
print(threshold_index);
  
  
var ndvi_threshold = ndvi_means[Math.round(threshold_index)];
ndvi_threshold = Math.min(ndvi_max, Math.max(ndvi_min, ndvi_threshold));
  
print('Detected NDVI threshold: ', ndvi_threshold);


var NDVI_Otsu = Im_plot.lt(ndvi_threshold);                                                  
    // NDVI_Otsu = NDVI_Otsu.mask(NDVI_Otsu)

// Filter Otsu channel masks
var con_kernel = ee.Kernel.chebyshev(1);                                                        // kernel for connected components 
var Filtered_River = NDVI_Otsu.connectedComponents(con_kernel,64).select(["labels"]).mask();    // Filter connected components labeler
    Filtered_River = NDVI_Otsu.where(Filtered_River.eq(1),zeros); //                          
    Filtered_River = Filtered_River.mask(Filtered_River); 

Map.addLayer(NDVI_Otsu,ndvi_vis,'Otsu',false);
Map.addLayer(Filtered_River,{min: 0, max: 1},'Otsu_channels');   




