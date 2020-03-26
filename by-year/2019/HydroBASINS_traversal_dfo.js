/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([6.591796875, 5.68158368342113]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.setOptions('SATELLITE')

// DFO Database
var dfoPolygons = ee.FeatureCollection("ft:1a5wFOdgcd4gxJeBKeEUmhoaC0nv8iv1r4M4jrwAK");
Map.addLayer(dfoPolygons, {}, 'DFO', false)

var dfoEvent = dfoPolygons.filterMetadata("ID", "equals", 2543);

var basins = ee.FeatureCollection('ft:1IHRHUiWkgPXOzwNweeM89CzPYSfokjLlz7_0OTQl')

print(ee.Number(basins.first().get('COAST')).neq(1))

var basins2 = basins.map(function(f) {
  var isFirst = ee.Number(f.get('NEXT_DOWN')).neq(0)
  
  return f.set('is_first', isFirst)
})

var basinsImage = ee.Image().int().paint(basins2, 'is_first')
  .paint(basins, 2, 1)

Map.addLayer(basins.filter(ee.Filter.eq('COAST', 1)), {color:'blue'}, 'coast', true, 0.4)

Map.addLayer(basinsImage, {palette:['555555', '000000','ffff00'], min:0, max:2}, 'all (raster)', true, 0.5)

Map.addLayer(basins, {color:'white'}, 'all', false, 0.5)

var l3 = ee.FeatureCollection('ft:13dShZ5yGqCEqk3dsJvYEL3lsa1hEmpMRldxK7aSa')
Map.addLayer(ee.Image().int().paint(l3, 0, 1), {palette:'ffffff'}, 'L3')





  
dfoEvent = geometry  
  
var current = basins.filterBounds(dfoEvent)

var currentBasinLayer = ui.Map.Layer(current, {color:'black'}, 'current', false)

Map.layers().add(currentBasinLayer, false)


function traverseDown(basins, all) {
  var join = ee.Join.inner('primary', 'secondary').apply(
    basins, all,
    ee.Filter.equals({leftField: 'NEXT_DOWN', rightField: 'HYBAS_ID'})
  );
  
  var existing = basins.aggregate_array('HYBAS_ID')
  
  return join.map(function(f) { return f.get('secondary')})
    .distinct(['HYBAS_ID'])
    .filter(ee.Filter.inList('HYBAS_ID', existing).not())
}

function traverseUp(basins, all) {
  var join = ee.Join.inner('primary', 'secondary').apply(
    all, basins,
    ee.Filter.equals({leftField: 'NEXT_DOWN', rightField: 'HYBAS_ID'})
  );
  
  var existing = basins.aggregate_array('HYBAS_ID')
  
  return join.map(function(f) { return f.get('primary')})
    .distinct(['HYBAS_ID'])
    .filter(ee.Filter.inList('HYBAS_ID', existing).not())
}


var colors = ['white', 'blue','green','red','yellow','orange','black', 'magenta']
var palette = ['ffffff', '0000ff','00ff00','ff0000','ffff00','ffa500','000000', '00ffff', 'ff00ff']
var source = current
var depth = palette.length


// down
/*
var catchmentsDown = ee.Image().int()

for(var i=0; i<depth; i++) {
  source = traverseDown(source, basins)
  catchmentsDown = catchmentsDown.paint(source, i+1)
  catchmentsDown = catchmentsDown.paint(source, 0, 0)
}
Map.addLayer(catchmentsDown, {palette: palette, min:0, max:palette.length}, 'sinks')
*/


// up

var catchmentsUp = ee.Image().int()

for(var i=0; i<depth; i++) {
  source = traverseUp(source, basins)
  catchmentsUp = catchmentsUp.paint(source, i+1)
  catchmentsUp = catchmentsUp.paint(source, 0, 0)
}
//Map.addLayer(catchmentsUp, {palette: palette, min:0, max:palette.length}, 'sources')


//var id = ee.Feature(basins.filterBounds(geometry).first()).get('HYBAS_ID')
//print(id)
//print(index.limit(10))
var upstreamIds = index.filter(ee.Filter.eq('hybas_id', 1050022420)).aggregate_array('parent_from')
var upstreamBasins = basins.filter(ee.Filter.inList('HYBAS_ID', upstreamIds))
var upstreamBasinsLayer = ui.Map.Layer(upstreamBasins, {color:'green'}, 'upstream')
Map.layers().add(upstreamBasinsLayer)

Map.onClick(function(coords) {
  coords = ee.Dictionary(coords)
  var pt = ee.Geometry.Point([coords.get('lon'), coords.get('lat')])
  var current = basins.filterBounds(pt)
  var id = ee.Feature(current.first()).get('HYBAS_ID')
  var upstreamIds = index.filter(ee.Filter.eq('hybas_id', id)).aggregate_array('parent_from')

  var upstreamBasins = basins.filter(ee.Filter.inList('HYBAS_ID', upstreamIds)).merge(current)
  
  var upstreamBasinsImage = ee.Image()
    .paint(upstreamBasins, 0, 3)
    .paint(upstreamBasins, 1)
    
  
  upstreamBasinsLayer.setEeObject(upstreamBasinsImage)
  upstreamBasinsLayer.setVisParams({min:0, max:1, palette:['ffff00', 'ffff00'], opacity: 0.5})

  //currentBasinLayer.setEeObject(current)

  print(coords)
})

var rivers = ee.FeatureCollection('ft:15-WpLuijWukjWsjUral2RFZXx0IR7j2lLTAi8lR9')
//print(ui.Chart.feature.histogram(rivers, 'UP_CELLS'))

Map.addLayer(ee.Image().int().paint(rivers, 1, 1), {palette:['ffffff'], opacity: 0.5}, 'rivers')
Map.addLayer(ee.Image().int().paint(rivers.filter(ee.Filter.gt('UP_CELLS', 500000)), 1, 3), {palette:['aaaaff'], opacity: 0.5}, 'rivers (large)')
