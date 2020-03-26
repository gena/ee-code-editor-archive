//Load Arkansas counties and add to map
var counties = ee.FeatureCollection('ft:1HU5I8RZ8Cjd3gQBRpipe6b8vXZABEzu8w_qDrrdK', 'geometry').filter(ee.Filter.eq('STATE_FIPS', 5));
print('Arkansas Counties', counties);
Map.centerObject(counties, 8);
Map.addLayer(counties, {}, 'Counties');

//Copy simple table in DataTable format from https://developers.google.com/earth-engine/charts
var dataTable = 
{
  cols: [{id: 'name', label: 'Airport Code', type: 'string'},
         {id: 'year', label: 'Elevation (m)', type: 'number'}],
  rows: [{c: [{v: 'SFO'}, {v: 4}]},
         {c: [{v: 'JFK'}, {v: 4}]},
         {c: [{v: 'DEN'}, {v: 1655}]},
         {c: [{v: 'LHR'}, {v: 25}]},
         {c: [{v: 'ZRH'}, {v: 432}]}]
};

//Print the DataTable as a table
print(ui.Chart(dataTable, 'Table'));

/***
 * Converts feature collection to DataTable compatible with charting API
 */
function featureCollectionToDataTable(features) {
  var feature = ee.Feature(features.first())
  var propertyNames = feature.propertyNames()

  function toTableColumns(s) {
    return {id: s, label: s, type: 'string'} 
  }

  var columns = propertyNames.map(toTableColumns)

  function featureToTableRow(f) {
    return {c: propertyNames.map(function(c) { return {v: ee.Feature(f).get(c)} })}
  }
  
  var rows = features.toList(5000).map(featureToTableRow)

  return ee.Dictionary({cols: columns, rows: rows})
}

var dataTable = featureCollectionToDataTable(counties).evaluate(function(dataTable) {
  //Print the Arkansas counties as a table, fails. 
  //Is there a way to convert FeatureCollection data (county name, FIPS code, etc.) into an easy-to-print table like above?
  print(ui.Chart(dataTable, 'Table'));
})


