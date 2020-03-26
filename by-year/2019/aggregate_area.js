//GSW layer 

var Water = ee.Image("JRC/GSW1_0/GlobalSurfaceWater");

var transition = Water.select('transition');

//Permafrost areas 
var permafrost = ee.FeatureCollection('users/edtrochim/permafrost_ice')
.filter(ee.Filter.eq('NUM_CODE', '1'))
print(permafrost);

Map.addLayer(permafrost)

//reduce transition classes to admin boundaries attempt 

var area_image = ee.Image.pixelArea().addBands(transition);

var new_reduce = area_image.reduceRegions({
      collection: permafrost,
      reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'transition_class_value'}),
      tileScale: 16,
      scale: 150
});

//function to convert the list of dictionaries with the summed areas into a single dictionary
function toDictionary(cur, prev){
  var key = ee.String("class_").cat(ee.String(ee.Dictionary(cur).get('transition_class_value'))); //get the transition class
  var value = ee.Dictionary(cur).get('sum'); //get the sum of the area 
  return ee.Dictionary(prev).set(key, value); //return as a property
}
 
var output = new_reduce.map(function(feature){
  var waterAreas = ee.List(feature.get("groups")).iterate(toDictionary, ee.Dictionary());
  return ee.Feature(null, ee.Dictionary(waterAreas).set("NUM_CODE",feature.get("NUM_CODE")));
});

print(output);

//output here creates a list with all relevant info
Export.table.toDrive({
      collection: output,
      description: 'water_transitions_NUM_CODE_10',
      fileFormat:"CSV"
});
