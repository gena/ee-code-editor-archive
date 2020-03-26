/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([88.79150390625, 24.135892733174522]),
    srtm = ee.Image("USGS/SRTMGL1_003"),
    s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.setOptions('SATELLITE')

Map.addLayer(ee.Image(1), {palette:['000000']}, 'dark', true, 0.5)

function addIsFirst(f) {
  var isFirst = ee.Number(f.get('next_down')).neq(0)

  return f.set('is_first', isFirst)
}

// basins level 4
var basinsLevel4 = ee.FeatureCollection('ft:1FxGTqGlr_XTSOL8r1zp-PIOCO3S3_6i2gI-KQeQZ')
var basinsLevel4Image = ee.Image().int()
  .paint(basinsLevel4, 1)
  .paint(basinsLevel4, 2, 1)

Map.addLayer(basinsLevel4Image, {palette:['555555', '000000','ffff00'], min:0, max:2, opacity:0.6}, 'L4', false)


// basins level 5
var basinsLevel5 = ee.FeatureCollection('ft:1IHRHUiWkgPXOzwNweeM89CzPYSfokjLlz7_0OTQl')
  .map(function(f) {
    return f
      .set('hybas_id', f.get('HYBAS_ID'))
      .set('next_down', f.get('NEXT_DOWN'))
  })


// EE BUG - geometry is broken
// var basinsLevel5 = ee.FeatureCollection("users/gena/HydroEngine/hybas_lev05_v1c")
//  .map(addIsFirst)
  
var basinsLevel5Image = ee.Image().int()
  // .paint(basinsLevel5, 'is_first')
  .paint(basinsLevel5, 1)
  .paint(basinsLevel5, 2, 1)

Map.addLayer(basinsLevel5Image, {palette:['555555', '000000','ffff00'], min:0, max:2, opacity:0.6}, 'L5', true)

// basins level 6
var basinsLevel6 = ee.FeatureCollection("users/gena/HydroEngine/hybas_lev06_v1c")
  .map(addIsFirst)
  
var basinsLevel6Image = ee.Image().int().paint(basinsLevel6, 'is_first')
  .paint(basinsLevel6, 2, 1)

Map.addLayer(basinsLevel6Image, {min:1, max:2, palette:['000000','ffff00'], opacity: 0.6}, 'L6', false)
Map.addLayer(basinsLevel6, {}, "L6 (raw)", false)

// basins level 3
var basinsLevel3 = ee.FeatureCollection('ft:13dShZ5yGqCEqk3dsJvYEL3lsa1hEmpMRldxK7aSa')
Map.addLayer(ee.Image().int().paint(basinsLevel3, 0, 1), {palette:'ffffff'}, 'L3')

// index
var index = ee.FeatureCollection("users/gena/HydroEngine/hybas_lev05_v1c_index")
var basins = basinsLevel5
//var index = ee.FeatureCollection("users/gena/hybas_lev06_v1c_index")
// var basins = basinsLevel6

Map.addLayer(index, {color:'green', opacity:0.3}, 'index', false)

var colors = ['white', 'blue','green','red','yellow','orange','black', 'magenta']
var palette = ['ffffff', '0000ff','00ff00','ff0000','ffff00','ffa500','000000', '00ffff', 'ff00ff']
var depth = palette.length

//var rivers = ee.FeatureCollection('ft:15-WpLuijWukjWsjUral2RFZXx0IR7j2lLTAi8lR9')
var rivers = ee.FeatureCollection('users/gena/HydroEngine/riv_15s_lev05')
print(rivers.first())
var largeRiversImage = ee.Image().paint(rivers.filter(ee.Filter.gt('UP_CELLS', 20000)), 1, 1)
Map.addLayer(largeRiversImage, {palette:['add8e6'], min:0, max:1}, 'rivers (UP > 20000)', true, 0.5)

//rivers = rivers.filter(ee.Filter.gt('UP_CELLS', 2000))

var riversLog = rivers.map(function(f) { return f.set('UP_CELLS_LOG', ee.Number(f.get('UP_CELLS')).log10())})

var riversImage = ee.Image().int();
for(var th=1; th<7; th+=1) {
  riversImage = riversImage.paint(riversLog.filter(ee.Filter.gt('UP_CELLS_LOG', th)), 1, th/3)
}

// selection and upstream

var upstreamBasinsLayer = ui.Map.Layer(ee.Image(), {min:0, max:1, palette:['ffff00', 'ffff00'], opacity: 0.3}, 'upstream')
Map.layers().add(upstreamBasinsLayer)

var upstreamRiversLayer = ui.Map.Layer(ee.Image(), {min:0, max:1, palette: ['ccffff']}, 'upstream rivers')
Map.layers().add(upstreamRiversLayer)

function updateBasinSelection(pt) {
  var current = basins.filterBounds(pt)
  var id = ee.Feature(current.first()).get('hybas_id')
  var upstreamIds = index.filter(ee.Filter.eq('hybas_id', id)).aggregate_array('parent_from')
  
  upstreamIds = ee.List(upstreamIds).add(id)
  
  print(upstreamIds)

  var upstreamBasins = basins.filter(ee.Filter.inList('hybas_id', upstreamIds))
  
  var upstreamBasinsImage = ee.Image()
    .paint(upstreamBasins, 0, 3)
    .paint(upstreamBasins, 1)
    
  upstreamBasinsLayer.setEeObject(upstreamBasinsImage)

  // select rivers
  var upstreamRivers = riversLog
    .filter(ee.Filter.and(
        ee.Filter.inList('HYBAS_ID', upstreamIds.map(function(id) { return ee.Number(id).format('%d') }))
        ,ee.Filter.gt('UP_CELLS', 3000)
      )
    )

  var upstreamRiversImage = ee.Image().int();
  for(var th=1; th<7; th+=1) {
    upstreamRiversImage = upstreamRiversImage.paint(upstreamRivers.filter(ee.Filter.gt('UP_CELLS_LOG', th)), 1, 100 * th / Map.getScale() )
  }
    
  upstreamRiversLayer.setEeObject(upstreamRiversImage)
  
  return {basins: upstreamBasins, rivers: upstreamRivers}
}

// Ganges basin 
var selection = updateBasinSelection(geometry)

Map.onClick(function(coords) {
  print(coords)
  coords = ee.Dictionary(coords)
  var pt = ee.Geometry.Point([coords.get('lon'), coords.get('lat')])
  
  updateBasinSelection(pt)
})

Map.addLayer(riversImage, {min:0, max: 1, palette:['aaaaff'], opacity: 0.5}, 'rivers', false)

var water = jrc.select('occurrence').divide(100)
water = water.mask(water)
Map.addLayer(water, {palette:['a0a0ff']}, 'jrc', false)

var layerRoads = ui.Map.Layer(ee.Image().paint(ee.FeatureCollection('TIGER/2016/Roads'),1,1), {palette:['ffffff']}, 'roads', false)

Map.layers().add(layerRoads)

Map.addLayer(ee.Image().paint(ee.FeatureCollection('TIGER/2010/Blocks'),1,1), {palette: ['ffff00']}, 'blocks', false)



// DAMS


var damAssets = [
  { name: 'OpenStreetMaps (points)', table: 'ft:1Daksuvel4ZUAfZsxuAUV_qv5Y2nnD_XEpbrJFDSB', color: 'blue'}, 
  { name: 'OpenStreetMaps (lines)', table: 'ft:1sFKaX1Cc8OyYYfK5blfSBl_0d_8gxh7HC3UQVAmY', color: 'blue'}, 
  { name: 'AQUATAT', table: 'ft:1JEYbvAwi-hV915oLk4t4mNuhrdNU_kKQX-_HgGdW', color:'teal'}, // errorneous, was used as a main source for GRanD?
  { name: 'GRanD', table: 'ft:1gC7USkuJloeUn7Odw6hXTvodiDZI_XkDJEFk063p', color: 'yellow'},
  { name: 'Wikipedia', table: 'ft:1FJikDoJpylgifMoiMCUcvadyaUX6jgh0Hub6IfX_', color: 'green'},
  { name: 'NWIS (validation)', table: 'ft:10bIIDcBgxWa8yhZ1GrIIKkyc66yXZ0M6lBRjEj6k', color: 'orange'},
  { name: 'King`s College London', table: 'ft:1nq9e5ZyboA83h6U_shzn0eGP6obvvl4UfQEMSgy7', color: 'red'} // check license, seems to be free for research, but not for redistribution?
  ]

var dams = ee.List(damAssets.map(function(asset) { return ee.FeatureCollection(asset.table).cache()}))
  .iterate(function(current, prev) {
    return ee.FeatureCollection(current).merge(prev)
  }, ee.FeatureCollection([]))

dams = ee.FeatureCollection(dams)
  .filterBounds(selection.basins)

Map.addLayer(dams, {color: 'yellow'}, 'dams')





/*s1 = s1
  .filterDate('2017-08-01', '2018-01-01')
  .filterBounds(Map.getBounds(true))
  .sort('system:time_start')
  
ee.List.sequence(1, s1.size().subtract(1)).getInfo(function(indices) {
  var list = s1.toList(s1.size())
  
  indices.map(function(i) {
    var image = ee.Image(list.get(i))
    
    image = image
      //.reduceResolution(ee.Reducer.percentile([25]))
      //.reproject(image.select(0).projection().scale(5,5))

    Map.addLayer(image, {min:-19, max:-1, bands: ['VH', 'VV', 'VH']}, i + ' VV', false)
    Map.addLayer(image, {min:-19, max:-1, bands: ['HV', 'HH', 'HV']}, i + ' HH', false)
    Map.addLayer(image.mask(image.lt(-13)), {min:-19, max:-1, bands: ['VV'], palette:['ffff00']}, i + ' VV (water)', false)
    Map.addLayer(image.mask(image.lt(-13)), {min:-19, max:-1, bands: ['HH'], palette:['ffff00']}, i + ' HH (water)', false)
  })
})

*/