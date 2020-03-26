/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([85.25887856952431, 25.626164395353488]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// var HydroBASINSimage = ee.Image("users/rutgerhofste/PCRGlobWB20V04/support/global_Standard_lev00_30sGDALv01");
var HydroBASINSimage = ee.Image("users/gena/HydroBASINS");

Map.addLayer(HydroBASINSimage, {}, 'raw', false)

var level = 12
var catchments = HydroBASINSimage.select('PFAF_12').divide(ee.Number(10).pow(ee.Number(12).subtract(level))).floor();


var catchmentsRGB = catchments.randomVisualizer().select([0, 1, 2])
//Map.addLayer(catchmentsRGB, {}, 'catchments', true, 0.6)

var values = HydroBASINSimage.reduceRegion({ reducer: ee.Reducer.first(), geometry: geometry, scale: 100})
print(values)

var value = ee.Number(values.get('PFAF_12'))

var mainBas = HydroBASINSimage.select('MAIN_BAS').eq(ee.Image.constant(values.get('MAIN_BAS')))

Map.addLayer(HydroBASINSimage.select('PFAF_12').randomVisualizer(), {}, 'raw (PFAF_12)', false, 0.1)
Map.addLayer(HydroBASINSimage.select('PFAF_9').randomVisualizer(), {}, 'raw (PFAF_9)', false)
Map.addLayer(HydroBASINSimage.select('PFAF_7').randomVisualizer(), {}, 'raw (PFAF_7)', false)
Map.addLayer(HydroBASINSimage.select('PFAF_6').randomVisualizer(), {}, 'raw (PFAF_6)', false)
Map.addLayer(HydroBASINSimage.select('PFAF_5').randomVisualizer(), {}, 'raw (PFAF_5)', false)
Map.addLayer(HydroBASINSimage.select('PFAF_4').randomVisualizer(), {}, 'raw (PFAF_4)', false)
Map.addLayer(HydroBASINSimage.select('PFAF_3').randomVisualizer(), {}, 'raw (PFAF_3)', false)

HydroBASINSimage = HydroBASINSimage.updateMask(mainBas)

Map.addLayer(HydroBASINSimage.select('PFAF_12').randomVisualizer(), {}, 'raw (PFAF_12) main', false, 0.1)
Map.addLayer(HydroBASINSimage.select('PFAF_9').randomVisualizer(), {}, 'raw (PFAF_9) main', false)
Map.addLayer(HydroBASINSimage.select('PFAF_7').randomVisualizer(), {}, 'raw (PFAF_7) main', false)
Map.addLayer(HydroBASINSimage.select('PFAF_6').randomVisualizer(), {}, 'raw (PFAF_6) main', false)
Map.addLayer(HydroBASINSimage.select('PFAF_5').randomVisualizer(), {}, 'raw (PFAF_5) main', false)
Map.addLayer(HydroBASINSimage.select('PFAF_4').randomVisualizer(), {}, 'raw (PFAF_4) main', false)
Map.addLayer(HydroBASINSimage.select('PFAF_3').randomVisualizer(), {}, 'raw (PFAF_3) main', false)

Map.addLayer(ee.Image(0), {}, 'black', true, 0.5)

Map.addLayer(mainBas.mask(mainBas), {palette: ['0000ff']}, 'MAIN_BAS', true, 0.2)

var mainBasId = HydroBASINSimage.select('HYBAS_ID').eq(ee.Image.constant(values.get('MAIN_BAS')))
Map.addLayer(mainBasId.mask(mainBasId), {palette: ['ffff00']}, 'MAIN_BAS (ID)', true, 0.2)

var nextSink = HydroBASINSimage.select('NEXT_SINK').eq(ee.Image.constant(values.get('NEXT_SINK')))
Map.addLayer(nextSink.mask(nextSink), {palette: ['00ffff']}, 'NEXT_SINK', false)

var nextSinkId = HydroBASINSimage.select('HYBAS_ID').eq(ee.Image.constant(values.get('NEXT_SINK')))
Map.addLayer(nextSinkId.mask(nextSinkId), {palette: ['00ffff']}, 'NEXT_SINK (ID)', false)

// internal sorting (I/O, SHP)

// var sortGT = HydroBASINSimage.select('SORT').gt(ee.Image.constant(values.get('SORT')))
//   .updateMask(nextSink)
// Map.addLayer(sortGT.mask(sortGT), {palette: ['ff00ff']}, '> SORT')

// var sortLT = HydroBASINSimage.select('SORT').lt(ee.Image.constant(values.get('SORT')))
//   .updateMask(nextSink)
// Map.addLayer(sortLT.mask(sortLT), {palette: ['ff00ff']}, '< SORT')

function getSelection(level) {
  var power = ee.Number(10).pow(ee.Number(level))
  var valueLeft = value.divide(power).floor()
  return catchments.divide(ee.Number(10).pow(ee.Number(level))).floor().eq(valueLeft)
}

function getUp(catchments, level) {
  var power = ee.Number(10).pow(ee.Number(level))
  var valueRight = value.mod(power)

  return catchments.mod(power).gt(valueRight)
}

function getDown(catchments, level) {
  var power = ee.Number(10).pow(ee.Number(level))
  var valueRight = value.mod(power)

  return catchments.mod(power).lt(valueRight)
}

function add(level) {
  var digits = 12 - level
  
  var selection = getSelection(digits)
  Map.addLayer(selection.mask(selection), { palette: ['ffff00'] }, 'selection ' + level, false, 0.6)

  var selectionUp = getUp(catchments.updateMask(selection), digits)
  Map.addLayer(catchments.mask(selectionUp), { palette: ['00ffff'] }, 'selection up ' + level, false, 0.6)
}

// [9,7,6].map(add)

[2,3,4,5,6,7].map(add)


/*
var selection2o = catchments.updateMask(selection2).mod(power).mod(2).eq(1)
Map.addLayer(selection2o.mask(selection2o), { palette: ['ff00ff'] }, 'selection 2o', true, 0.9)

var selection3o = catchments.updateMask(selection3).mod(power).mod(2).eq(1)
Map.addLayer(selection3o.mask(selection3o), { palette: ['00ffff'] }, 'selection 3o', true, 0.9)
*/
var rivers = ee.FeatureCollection('users/gena/HydroEngine/riv_15s_lev05')
Map.addLayer(rivers.filter(ee.Filter.gt('UP_CELLS', 10000)).style({ color: 'ffffff', width: 1 }), {}, 'rivers', true, 0.2)

Map.addLayer(rivers.style({ color: '000000', width: 1 }), {}, 'rivers (all)', false)

Map.setOptions('SATELLITE')

// show catchment Pfafstetter ids
var scale = Map.getScale()
var bounds = ee.Geometry(Map.getBounds(true)).buffer(scale * 100)
var level = 4
var labelLevel = 'PFAF_' + level

var catchmentsVector = HydroBASINSimage.select('PFAF_12')
  .divide(ee.Number(10).pow(ee.Number(12).subtract(level))).floor().int()
  .reduceToVectors({ eightConnected: false, geometry: bounds, scale: scale, labelProperty: labelLevel })
  .map(function(f) {
    return f.set({ area: f.area(scale) }) 
  }).filter(ee.Filter.gt('area', 10000000))

var text = require('users/gena/packages:text')
Map.addLayer(catchmentsVector, {}, 'catchments (vector)', false)

var catchmentLabels = catchmentsVector.map(function(f) {
  var str = ee.Number(f.get(labelLevel)).format('%d')
  
  return text.draw(str, f.geometry().centroid(scale), scale, { 
    fontSize: 14, textColor: '000000', fontType: 'Arial',
    outlineColor: 'ffffff', outlineWidth: 1, outlineOpacity: 0.6
  })
})

catchmentLabels = ee.ImageCollection(catchmentLabels).mosaic()

// Map.addLayer(catchmentLabels, {}, 'catchment (' + labelLevel + ')')
