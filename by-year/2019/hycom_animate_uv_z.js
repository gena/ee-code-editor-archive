/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var uv = ee.ImageCollection("HYCOM/sea_water_velocity"),
    z = ee.ImageCollection("HYCOM/sea_surface_elevation");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var palettes = require('users/gena/packages:palettes')
var utils = require('users/gena/packages:utils')
var animation = require('users/gena/packages:animation')

uv = uv.filterDate('2016-01-01', '2020-01-01')
z = z.filterDate('2016-01-01', '2020-01-01')

// merge
var filterEqualTime = ee.Filter.equals({
  leftField: 'system:time_start',
  rightField: 'system:time_start'
});

var combined = ee.ImageCollection(ee.Join.saveFirst('z').apply(uv, z, filterEqualTime)).map(function(i) {
  return i.addBands(i.get('z'))
})

// render frames (abs(UV) as a color and Z as hillshade)
var frames = combined.map(function(i) {
  i = i.resample('bicubic')
  var uvAbs = i.select(0, 1).pow(2).reduce(ee.Reducer.sum()).sqrt()
  var rgb = uvAbs.visualize({ min: 0, max: 1500, palette: palettes.cmocean.Ice[7]})
  var z = i.select('surface_elevation')
  var rgb3d = utils.hillshadeRGB(rgb, z, 1.5, 500, 315, 25)

  return rgb3d
    .set({ label: i.date().format() })
})

animation.animate(frames, { label: 'label', maxFrames: 50 })

Map.setOptions('SATELLITE')

