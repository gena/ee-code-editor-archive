/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: 0B4A8B */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var imageCollection = ee.ImageCollection("UCSB-CHG/CHIRPS/PENTAD").filterDate('2010-01-01', '2016-01-01');

// Most of central Sub-saharan Africa
var polygon = ee.Geometry.Polygon([[-14.0, 20.0], [-14.0, -16.0], [50.0, -16.0], [50.0, 20.0], [-14.0, 20.0]]);  

var lta_array = [];

// Create a long term average for each month/pentad combination
for (var i=1; i<=12; i++)
{
  for (var j=1; j<=6; j++)
  {
    var lta = imageCollection
      .filterMetadata("month", "equals", i)
      .filterMetadata("pentad", "equals", j)
      .mean();
    
    // Tag each with month and pentad properties  
    lta = lta.set({'month': i, 'pentad': j});
    
    lta_array.push(lta);
  }
}

// Convert to ImageCollection
var ltacollection = ee.ImageCollection(lta_array);

print(ltacollection);

var normalised = imageCollection.map(function(image) {
  var lta = ee.Image(ltacollection.filterMetadata('month', 'equals', image.get('month')).
    filterMetadata('pentad', 'equals', image.get('pentad')).first());
  // Display deficit in RED (LTA > current), abundance in GREEN (current > LTA) and LTA in BLUE
  return ee.Image.rgb(lta.subtract(image).clamp(0.0,50.0).multiply(255.0/50.0).uint8(), 
        image.subtract(lta).clamp(0.0,50.0).multiply(255.0/50.0).uint8(), 
        lta.clamp(0.0,50.0).multiply(255.0/50.0).uint8());
});

//print(normalised);

Map.addLayer(ee.Image(normalised.first()), {}, "First");
Map.addLayer(polygon);

Export.video(normalised, 'chirps_the_recent_years_HD', {
  dimensions: '1280',
  framesPerSecond: 6,
  region: JSON.stringify(polygon.getInfo())});