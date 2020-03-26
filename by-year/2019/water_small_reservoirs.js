/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var L5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA_FMASK"),
    L8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA_FMASK"),
    Thirumal_Samudram_Outline = /* color: #d63000 */ee.Geometry.Polygon(
        [[[77.70046232499362, 9.822657234370496],
          [77.70063398691627, 9.796607834212102],
          [77.75865566541745, 9.798383994634136],
          [77.75608073899048, 9.81639879912955],
          [77.72612575986591, 9.813438687336859],
          [77.70732880148216, 9.82206521495392]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//var Thirumal_Samudram = ee.FeatureCollection('ft:19Y6iXzKyii1Y5zfqNxjlkCwY5DY3-FDwJ_Zou8st');
//Map.addLayer(Thirumal_Samudram)

//////////////////////
//BUILD: Land surface water mapping
//SENSORS: Landsat 5, 7 and 8
/////////////////////////////////////////////////////////////////

// User specified parameters
//Set Extent 
var extent= Thirumal_Samudram_Outline
//Set start and End year
var startyear = 1990;
var startmonth= 1;
var startday= 1;
var endyear = 2017;
var endmonth= 12;
var endday= 30;

//Set cloud threshold for sorting
var cloud_thresh = 50;

/////////////////////////////////////////////////////////////////////
//Start of Script
var years = ee.List.sequence(startyear,endyear);
var startdate = ee.Date.fromYMD(startyear,startmonth,startday);
var enddate = ee.Date.fromYMD(endyear,endmonth,endday)

// Data: filter all collections by set dates
var l5images = L5.filterDate(startdate,enddate).filterBounds(extent);
var l8images = L8.filterDate(startdate,enddate).filterBounds(extent);

// var images = L8.select(['B3', 'B6'], ['green', 'swir1'])
var images = L5.map(function(i) { return i.resample('bicubic') })
  .filter(ee.Filter.or(ee.Filter.dayOfYear(120, 240), ee.Filter.dayOfYear(300, 365))) // exclude cloudy days
  .select(['B2', 'B5', 'B4'], ['green', 'swir1', 'nir'])
  
var image = images.reduce(ee.Reducer.percentile([3])).rename(['green', 'swir1', 'nir'])  
var water = image.normalizedDifference(['green', 'swir1'])

Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min:0.03, max:0.3})
Map.addLayer(water.mask(water.gt(0.2)), {min:0, max:0.3})


//return

// Functions: cloud score funtion
var cloudfunction = function(image){
  //use add the cloud likelihood band to the image
  var CloudScore = ee.Algorithms.Landsat.simpleCloudScore(image);
  //isolate the cloud likelihood band
  var quality = CloudScore.select('cloud');
  //get pixels above the threshold
  var cloud01 = quality.gt(cloud_thresh);
  //create a mask from high likelihood pixels
  var cloudmask = image.mask().and(cloud01.not());
  //mask those pixels from the image
  return image.updateMask(cloudmask);
};

// remove clouds from image collection
var l5images = l5images.map(cloudfunction);
var l8images = l8images.map(cloudfunction);

//Calcaulte NDWI, Threshold and extent in one function for L5
function l57Ndwitest(img) {
  var ndwi = img.normalizedDifference(['B2', 'B4']).rename('NDWI');
  var addbands= img.addBands(ndwi);
  var NDWIband = addbands.select("NDWI")
  var threshold = NDWIband.gte(0.10).rename('NDWI');
  var cliptoregion= threshold.clip(extent);
  var ndwiViz = {min: -1, max: 1, palette: ['00FFFF', '0000FF']};
  var Mask = cliptoregion.updateMask(cliptoregion.gte(0.10));
  return Mask
}

//Calcaulte NDWI, Threshold and extent in one function for L8
function l8Ndwitest(img) {
  var ndwi = img.normalizedDifference(['B3', 'B5']).rename('NDWI');
  var addbands= img.addBands(ndwi);
  var NDWIband = addbands.select("NDWI")
  var threshold = NDWIband.gte(0.10).rename('NDWI');
  var cliptoregion= threshold.clip(extent);
  var ndwiViz = {min: -1, max: 1, palette: ['00FFFF']};
  var Mask = cliptoregion.updateMask(cliptoregion.gte(0.10));
  return Mask
}

var l5ndwitest = l5images.map(l57Ndwitest);
Map.addLayer(l5ndwitest,{}, "NDWI All Scenes l5")
print (l5ndwitest, {}, "NDWI All Scenes l5" )

var l8ndwitest = l8images.map(l8Ndwitest);
Map.addLayer(l8ndwitest,{}, "NDWI All Scenes l8");
print (l8ndwitest, {}, "NDWI All Scenes l8" );


//l5 Reduce to Vector and calculate Area
function reduce(img) {
  var vector = img.reduceToVectors({
    geometry: extent,
    reducer: ee.Reducer.countEvery(),
    scale: 30,
    geometryType: 'polygon',
    eightConnected: true,
    //crs: myimg.projection(),
    //maxPixels: 5e9,
    tileScale: 4
  })
  var vectorsfilter = vector.filter(ee.Filter.gt('count',3));
  var area= vectorsfilter.map(function(f) {
    return f.set({area: f.area(0.1)});
    });
  return area;
} 

// Map the function over the collection and display the result.
var vectors= l5ndwitest.map(reduce);
Map.addLayer(vectors.flatten(),{}, "Water Extent");
print (vectors, {}, "WaterExtent")

//Need to export all
Export.table.toDrive({
  collection: vectors.flatten(),
  description: 'Area',
  fileFormat: 'CSV'
});
   