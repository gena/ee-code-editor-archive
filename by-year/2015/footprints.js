/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var addToMapAsRaster = function(shapes, name, palette, width, opacity, filled, visible) {
  var outline = width;
  var img; 
  
  if (filled) {
    img = ee.Image().toByte();
    img = img.paint(shapes, 1); // paint fill
    img = img.paint(shapes, 0, outline + 1); // paint outline
  } else {
    img = ee.Image(0).mask(0);
    img = img.paint(shapes, 0, width);
  }

  var options = {
    palette: palette,
    max: 1,
    opacity: opacity
  };

  Map.addLayer(img, options, name, visible);

  return img;
}


//print(Map.getCenter())
Map.setCenter(152.24, -28.35, 14)

var bounds = ee.Geometry(Map.getBounds(true))

var count = 4;
var images = images
  // .select(['B6', 'B5', 'B3'])
  .select(['BQA'])
  .filterBounds(Map.getBounds(true))
//  .filterMetadata('system:start_time', 'greater_than', 1366934269968)
//  .filterMetadata('system:start_time', 'less_than', 1369699088090)
  .sort('date_range').toList(count, 36)
  //.filterMetadata('intersects', 'equals', true)
  //.toList(count, 0)
  // .filterMetadata('CLOUD_COVER', 'less_than', 10)

var features = ee.FeatureCollection(ee.ImageCollection(images))

print(features)
addToMapAsRaster(features, 'footprints', ['000000','aaaaaa'], 1, 0.5, true, true)

for(var i = 0; i < count; i++) {
  var image = ee.Image(images.get(i));
  
  var timeStart = image.get('system:time_start');
  var dateTime = ee.Date(timeStart).format('yyyy-MM-dd HH:mm:ss').getInfo();
  
  print(timeStart)
  print(dateTime)
  
  // Map.addLayer(image, {min: 0.05, max:0.5}, dateTime)
  Map.addLayer(image, {}, dateTime)
}

Export.table(features, 'footprints', {driveFolder:'GIS (Gena)', driveFileNamePrefix: 'footprints', fileFormat: 'KML'})
