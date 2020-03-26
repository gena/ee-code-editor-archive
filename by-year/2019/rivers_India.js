/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var outlet = /* color: #d63000 */ee.Geometry.Point([33.41217041015625, -24.839088077763837]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var hydro = require('users/gena/packages:hydro')
var style = require('users/gena/packages:style')

var catchments = hydro.getCatchmments({level:5, outlet: outlet})
Map.addLayer(catchments, {}, 'catchments')

var catchments3 = hydro.getCatchmments({level:3})
Map.addLayer(ee.Image().paint(catchments3, 1, 1), {palette: ['ffffff']}, 'catchments (L3)')
print(catchments3.size())

var hydroLakes = ee.FeatureCollection("users/gena/HydroLAKES_polys_v10")
Map.addLayer(hydroLakes, {color: 'yellow'}, 'HydroLAKES (features)', false)
Map.addLayer(ee.Image().paint(hydroLakes, 1, 1), {palette:['ffffff']}, 'HydroLAKES', true, 0.5)

var waterOccurrence = ee.Image('JRC/GSW1_0/GlobalSurfaceWater').select('occurrence').divide(100)
Map.addLayer(waterOccurrence, {min: 0, max:1, palette: style.Palettes.Hot }, 'JRC (1984-2015) (all)', true, 0.3)

Map.addLayer(waterOccurrence.clip(catchments), {min: 0, max:1, palette: style.Palettes.Hot }, 'JRC (1984-2015)')
//Map.addLayer(waterOccurrence.clip(catchments), {min: 0, max:1, palette: style.Palettes.RedToBlue }, 'JRC (1984-2015)')
Map.addLayer(waterOccurrence.clip(catchments), {min: 0, max:1, palette: style.Palettes.Water }, 'JRC (1984-2015)', false)

var rivers = ee.FeatureCollection('ft:1yMXz_cItkAJFvmeXNcsuW2i7kK5i1iJ0QcYK3g')
Map.addLayer(rivers, {color: 'red'}, 'rivers (Natural Earth)')


style.SetMapStyleDark()