/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var pt1 = /* color: d63000 */ee.Geometry.Point([-66.522216796875, -6.375353167891235]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//User inputs
var lng1 = -65.885;
var lat1 = -8.03666;
var lng2 = -60.885;
var lat2 = -8.03666;
var lng3 = -60.885;
var lat3 = -13.03666;
var lng4 = -65.885;
var lat4 = -13.03666;
var region = ee.Geometry.Polygon(
  [[[lng1, lat1], 
  [lng2, lat2], 
  [lng3, lat3], 
  [lng4, lat4]]]);
  
var studyArea = ee.FeatureCollection([ee.Feature(ee.Geometry.Polygon(region.bounds().getInfo().coordinates[0])).buffer(100)]);


var start = '2000-01-01';
var end = '2010-01-01';
var historyEnd = "2008-02-01";
var monitoringStart ="2008-01-03";

//More user inputs
var cloudThresh = 5;


//End user inputs
//////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
var LC7_BANDS = ['B1','B2','B3','B4','B5','B7'];
var STD_NAMES = ['blue','green','red','nir','swir1','swir2'];

var images_TOA = ee.ImageCollection('LANDSAT/LE7_L1T_TOA')
  .filterDate(start, historyEnd)
  .filter(ee.Filter.dayOfYear(160, 240))
  .filterBounds(studyArea)

var images_SR = ee.ImageCollection('LEDAPS/LE7_L1T_SR')
  .filterDate(start, historyEnd)
  .filter(ee.Filter.dayOfYear(160, 240))
  .filterBounds(region)

// create inner join of two filtered image collection using time
var filter = ee.Filter.equals({ leftField: 'system:time_start', rightField: 'system:time_start'});
var join = ee.Join.inner().apply(images_TOA, images_SR, filter);
print(join.first())

// create a new image collection containing SR image and cloud score generated from TOA
var results = ee.ImageCollection(join.map(function(match) {
  var toa = ee.Image(match.get('primary'))
  var sr = ee.Image(match.get('secondary'))
  
  return sr.addBands(ee.Algorithms.Landsat.simpleCloudScore(toa));
}))

var i0 = ee.Image(results.first());

var img = i0.select(['B3', 'B2', 'B1']);
var cloud = i0.select('cloud');

Map.addLayer(img, {min:100, max:500}, 'SR')
Map.addLayer(cloud.mask(cloud), {min:0, max:100, palette: ['aaaa00', 'ffff00']}, 'cloud')

Map.centerObject(pt1, 13)

/*
var list_images_SR = images_SR.toList(5000);

//Function to mask clouds
//Assumes the image is a Landsat image


function maskClouds(img_TOA){
  // Add a cloud score band.  It is automatically called 'cloud'.
  var cloud_score_TOA = ee.Algorithms.Landsat.simpleCloudScore(img_TOA);

  // Create a mask from the cloud score and combine it with the image mask.
  var mask_of_TOA = img_TOA.mask().and(cloud_score_TOA.select(['cloud']).gt(cloudThresh));
  // var masked_SR = img_SR(mask_of_TOA);
  return mask_of_TOA;
}


var Coll = images_TOA.map(maskClouds);

for (var i = 0; i<Coll.length; ++1)
{
  var img_SR = list_images_SR.get(i);
  var masked_SRimage = img_SR.mask(Coll[i]);
  masked_List = masked_List.add(masked_SRimage);
}*/