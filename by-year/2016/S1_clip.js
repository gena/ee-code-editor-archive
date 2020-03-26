/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #ff0000 */ee.Geometry.Polygon(
        [[[-121.2890625, 53.80065082633023],
          [-115.224609375, 48.80686346108517],
          [-109.072265625, 48.45835188280866],
          [-108.896484375, 60.28340847828243],
          [-120.849609375, 60.413852350464914]]]),
    geometry2 = /* color: #00ff00 */ee.Geometry.Polygon(
        [[[-114.78515625, 55.128649068488805],
          [-114.609375, 53.592504809039376],
          [-111.708984375, 53.592504809039376],
          [-111.708984375, 55.429013452407396]]]),
    geometry3 = /* color: #0000ff */ee.Geometry.Polygon(
        [[[-121.234130859375, 55.296417650226466],
          [-121.201171875, 54.7040939250722],
          [-116.4111328125, 54.608763726896285],
          [-116.444091796875, 55.2776486437775]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(geometry)
  .filterDate('2016-04-01', '2016-10-30')
  .filterMetadata('resolution_meters', 'equals' , 10)
  .map(function (img) {
          return img.clip(img.geometry().buffer(-10000));
  });

print(s1);

var s1 = s1.select(['VV']);
var count1 = s1.count();
var s1 = s1.mean();

Map.addLayer(s1, {min:-25, max:-5}, 's1 (clip -10 000)');
Map.addLayer(count1, {min:0, max:50}, 'count', false);


// alternative method
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(geometry)
  .filterDate('2016-04-01', '2016-10-30')
  .filterMetadata('resolution_meters', 'equals' , 10)
  .map(function (image) {
      var b0 = image.select('VV');

      // remove bad pixel by detecting low homegeneity areas
      var glcm = b0.multiply(10).toInt()
        .glcmTexture({size: 3})
        //.reproject(b0.projection());
      var low = glcm.select(0).lt(0.2).unmask()
         .focal_min(5, 'square', 'pixels') // some thiner non-homogeneous edge, left overs
        
      image = image
        .updateMask(low)

      return image
  });
  
var s1 = s1.select(['VV']);

var count2 = s1.count();
var s1 = s1.mean();
Map.addLayer(s1, {min:-25, max:-5}, 's1 (glcm)');
Map.addLayer(count2, {min:0, max:50}, 'count', false);


function test() {
  var image = ee.Image(ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(Map.getBounds(true))
    //.filterDate('2016-04-01', '2016-10-30')
    .filterMetadata('resolution_meters', 'equals' , 10)
    .select(['VV'])
    .toList(1, 3).get(0));

  Map.addLayer(image, {min:-25, max:-5}, 'image');

  var glcm = image.multiply(10).toInt().glcmTexture({size: 3})
  Map.addLayer(glcm.select(0), {min:0, max:0.1}, 'homogeneity 3');

  var low = glcm.select(0).lt(0.1).unmask()
  Map.addLayer(low.mask(low), {}, 'low');
}

// test()

// no filter
// alternative method
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(geometry)
  .filterDate('2016-04-01', '2016-10-30')
  .filterMetadata('resolution_meters', 'equals' , 10)

var s1 = s1.select(['VV']);
var count3 = s1.count();
var s1 = s1.mean();

Map.addLayer(s1, {min:-25, max:-5}, 's1 (original)', false);
Map.addLayer(count3, {min:0, max:50}, 'count', false);

Map.addLayer(count3.subtract(count1), {min:0, max:10, palette:['ffffff', 'ff0000']}, 'count diff (original - clip (10 000 m))', false);
Map.addLayer(count3.subtract(count2), {min:0, max:10, palette:['ffffff', 'ff0000']}, 'count diff (original - glcm)', false);


