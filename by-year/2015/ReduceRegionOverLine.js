/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    line = /* color: 98ff00 */ee.Geometry.LineString(
        [[-111.52839660644531, 40.416371399358034],
         [-111.51406288146973, 40.40637249520861]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.setCenter(-111.50, 40.41, 14)

var band = 'B5'

// filter images
images = images
  .select(band)
  .filterBounds(line)

// compute sum of NIR values over line as image collection
images = images
  .map(function(image) {
    var sum = ee.Image.constant(image.reduceRegion(ee.Reducer.mean(), line, 300).get(band)).toFloat();
    return ee.Image(sum);
  })

Map.addLayer(images.limit(10), {}, 'images', false)

// add first 5 images
var count = 5;
var list = images.toList(5, 0);
  
for(var i = 0; i<count; i++) {
  Map.addLayer(ee.Image(list.get(i)), {min:0, max:0.3}, i.toString())    
}
