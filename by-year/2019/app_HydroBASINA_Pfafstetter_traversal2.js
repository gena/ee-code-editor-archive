/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var riversNE = ee.FeatureCollection("users/gena/ne_10m_rivers_lake_centerlines_scale_rank");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Map.setCenter(87.3031, 25.4325, 8)

// var HydroBASINSimage = ee.Image("users/rutgerhofste/PCRGlobWB20V04/support/global_Standard_lev00_30sGDALv01");
var HydroBASINSimage = ee.Image("users/gena/HydroBASINS");

// Map.addLayer(ee.Image(0), {}, 'black', true, 0.5)

// Map.addLayer(HydroBASINSimage, {}, 'raw', false)

Map.setOptions('SATELLITE')

Map.addLayer(HydroBASINSimage.select('PFAF_12').randomVisualizer(), {}, 'raw (PFAF_12)', false, 0.5)

var level = 12
var catchments = HydroBASINSimage.select('PFAF_12').divide(ee.Number(10).pow(ee.Number(12).subtract(level))).floor();

var selectionLayer = ui.Map.Layer(ee.Image(), { palette: ['ffff00'] }, 'selection', true, 0.6)
Map.layers().add(selectionLayer)

var selectionUpLayer = ui.Map.Layer(ee.Image(), { palette: ['00ffff'] }, 'upstream', true, 0.4)
Map.layers().add(selectionUpLayer)

var selectionSmallLayer = ui.Map.Layer(ee.Image(), { palette: ['ff0000'] }, 'selection (small)', true, 0.6)
Map.layers().add(selectionSmallLayer)

var levels = [2,3,4,5,6,7]
var levelLayers = {};
var levelUpLayers = {};

var id = ee.Number(452435500200) // default

function addLevelLayer(level) {
  var digits = 12 - level
  
  var selection = getSelection(digits, id)
  var layer = ui.Map.Layer(selection.mask(selection), { palette: ['ffff00'] }, 'selection ' + level, false, 0.6)
  Map.layers().add(layer)
  levelLayers[level] = layer

  var selectionUp = getUp(catchments.updateMask(selection), digits, id)
  var layerUp = ui.Map.Layer(catchments.mask(selectionUp), { palette: ['00ffff'] }, 'selection up ' + level, false, 0.6)
  Map.layers().add(layerUp)
  levelUpLayers[level] = layerUp
}

function updateLevelLayer(level) {
  var digits = 12 - level
  
  var selection = getSelection(digits, id)
  levelLayers[level].setEeObject(selection.updateMask(selection))

  var selectionUp = getUp(catchments.updateMask(selection), digits, id)
  levelUpLayers[level].setEeObject(catchments.mask(selectionUp))
}


function getSelection(level, value) {
  var power = ee.Number(10).pow(ee.Number(level))
  var valueLeft = value.divide(power).floor()
  
  print('Value left: ', valueLeft)
  
  return catchments.divide(ee.Number(10).pow(ee.Number(level))).floor().eq(valueLeft)
}

function getUp(catchments, level, value) {
  var power = ee.Number(10).pow(ee.Number(level))
  var valueRight = value.mod(power)
  
  print('Value right: ', valueRight)

  return catchments.mod(power).gt(valueRight)
}

function getDown(catchments, level, value) {
  var power = ee.Number(10).pow(ee.Number(level))
  var valueRight = value.mod(power)

  return catchments.mod(power).lt(valueRight)
}

Map.onClick(function(pt) {
  pt = ee.Geometry.Point([pt.lon, pt.lat])
  
  var values = HydroBASINSimage.reduceRegion({ reducer: ee.Reducer.first(), geometry: pt, scale: 100})
  
  var order = ee.Number(values.get('ORDER'))
  print('Order: ', order)

  var value = ee.Number(values.get('PFAF_12'))
  print('PFAF_12: ', value)

  var digits = ee.Number(12).subtract(order.add(2))
  print('Digits: ', digits)
  
  var selection = getSelection(digits, value)

  selection = selection.updateMask(HydroBASINSimage.select('MAIN_BAS').eq(ee.Image.constant(values.get('MAIN_BAS'))))
  selectionLayer.setEeObject(catchments.mask(selection))
  
  selectionSmallLayer.setEeObject(selection.updateMask(HydroBASINSimage.select('PFAF_12').eq(ee.Image.constant(value))))

  var selectionUp = getUp(catchments.updateMask(selection), digits, value)
  selectionUpLayer.setEeObject(catchments.mask(selectionUp))
  
  // levels.map(updateLevelLayer)
})

var rivers = ee.FeatureCollection('users/gena/HydroEngine/riv_15s_lev05')
Map.addLayer(rivers.filter(ee.Filter.gt('UP_CELLS', 1000)).style({ color: 'ffffff', width: 2 }), {}, 'rivers', false)
Map.addLayer(rivers.style({ color: 'ffffff', width: 1 }), {}, 'rivers (all)', false, 0.8)

Map.addLayer(riversNE.style( { color: 'blue' }), {}, 'rivers NE')

//Map.setOptions('SATELLITE')

// levels.map(addLevelLayer)
