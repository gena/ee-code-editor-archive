/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([38.8916015625, -8.015715997869059]),
    geometry2 = /* color: #98ff00 */ee.Geometry.Point([-44.12078744582226, -20.119943271505925]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var animation = require('users/gena/packages:animation')
var hydro = require('users/gena/packages:hydro')
var style = require('users/gena/packages:style')
var colorbrewer = require('users/gena/packages:colorbrewer')  


hydro.Map.addDem({layer: {visible: false, name: 'DEM'}})
hydro.Map.addHand({layer: {visible: false, name: 'HAND'}})

var catchments3 = hydro.getCatchments({level:3})
Map.addLayer(ee.Image().paint(catchments3, 1), {palette: ['000000']}, 'catchments (L3), fill', false, 0.5)
Map.addLayer(ee.Image().paint(catchments3, 1, 1), {palette: ['ffffff']}, 'catchments (L3)', false, 0.75)
 
var catchments6 = hydro.getCatchments({level:6})
Map.addLayer(ee.Image().paint(catchments6, 1, 1), {palette: ['ffffff']}, 'catchments (L6)', false, 0.75)

// hydro.Map.addFlowAccumulation({threshold: 1000})
hydro.Map.addFlowAccumulation({threshold: 100, type: 'vector', layer: { opacity: 0.5, visible: false, name: 'rivers, FA < 100' } })
hydro.Map.addFlowAccumulation({threshold: 10000, type: 'vector', layer: { opacity: 0.5, name: 'rivers, FA < 10000' } })
hydro.Map.addFlowAccumulation({threshold: 100000, type: 'vector', layer: { opacity: 1, name: 'rivers, FA < 1000000' }})

var rivers = ee.FeatureCollection('ft:1yMXz_cItkAJFvmeXNcsuW2i7kK5i1iJ0QcYK3g')
Map.addLayer(rivers, {color: 'd7301f'}, 'rivers (Natural Earth)', false, 0.5)

var waterOccurrence = ee.Image('JRC/GSW1_0/GlobalSurfaceWater').select('occurrence').divide(100)
  
waterOccurrence = waterOccurrence.updateMask(waterOccurrence.mask()
  .focal_max(2)
  .focal_mode(2, 'circle', 'pixels', 3))  
  
//waterOccurrence = waterOccurrence.updateMask(waterOccurrence.gt(0.3))

Map.addLayer(waterOccurrence, {min: 0, max:1, palette: style.Palettes.Hot }, 'JRC (1984-2015) (all)', false, 0.3)

// add an active water mask selection layer
var layerCatchments = ui.Map.Layer(ee.Image(), {}, 'catchments')
Map.layers().add(layerCatchments)

var layerSelection = ui.Map.Layer(ee.Image(), {min: 0, max:1, palette: style.Palettes.Hot }, 'JRC (1984-2015) hot')
Map.layers().add(layerSelection)

var layerSelection2 = ui.Map.Layer(ee.Image(), {min: 0, max:1, palette: style.Palettes.RedToBlue }, 'JRC (1984-2015) red-to-blue', false)
Map.layers().add(layerSelection2)

var layerSelection3 = ui.Map.Layer(ee.Image(), {min: 0, max:1, palette: style.Palettes.Water }, 'JRC (1984-2015) water', false)
Map.layers().add(layerSelection3)

function selectUpstreamWater(pt) {
  var catchments = hydro.getCatchments({level:6, outlet: pt})
  layerCatchments.setEeObject(catchments)
  
  layerSelection.setEeObject(waterOccurrence.clip(catchments))
  layerSelection2.setEeObject(waterOccurrence.clip(catchments))
  layerSelection3.setEeObject(waterOccurrence.clip(catchments))
}

Map.onClick(function(pt) {   
  pt = ee.Geometry.Point(ee.Dictionary(pt).values().reverse())
  selectUpstreamWater(pt)
})


var geometry = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point([
          80.89190,
          15.98302
        ]))])

// default selection
selectUpstreamWater(geometry)


var color = colorbrewer.Palettes.Blues[5][4]
var selection = ee.FeatureCollection([])
var selectionLayer = ui.Map.Layer(selection, {color: color}, 'selected waterbody (click)')
Map.layers().add(selectionLayer)


// precipitation 

// add NCEP, GPM

var gpm = ee.ImageCollection("NASA/GPM_L3/IMERG"),
    ncep = ee.ImageCollection("NOAA/CFSV2/FOR6H"),
    gsmap = ee.ImageCollection('JAXA/GPM_L3/GSMaP/v6/operational') // hourly; 

print('Times: ', gsmap.sort('system:time_start', false).limit(10).toList(10).map(function(i) { return ee.Image(i).date() }))

// var startDate = '2017-08-25'; // Harvey
// var startDate = '2019-01-01'; // Irma 
// var startDate = '2019-01-25'; // Dar es Salaam flood
var startDate = '2019-01-15'; // Brazil dam failure

var maxHours = 2400

// metainfo for precipitation datasets
var datasets = [
  {
    images: ncep, 
    var: 'Precipitation_rate_surface_6_Hour_Average',
    stepHours: 6,
    maxValue: 0.002
  },
  {
    images: gpm, 
    var: 'precipitationCal',
    stepHours: 3,
    maxValue: 15
  },
  {
    images: gsmap, 
    var: 'hourlyPrecipRate',
    stepHours: 1,
    maxValue: 15
  },
]
 

//var dataset = datasets[0] // NCEP, 6 hours
//var dataset = datasets[1] // GPM, 3 hours
var dataset = datasets[2] // GSMaP, 1 hours

var colors = ['eff3ff', 'bdd7e7', '6baed6', '3182bd', '08519c']

Map.setOptions('SATELLITE')

Map.addLayer(ee.Image(1), {opacity:0.5}, 'bg', false)

function render(image) {
  var date = image.date()
  
  var image = image
    .resample('bilinear')
    .convolve(ee.Kernel.gaussian(3, 2, 'pixels'))
  
  return image.mask(image.divide(dataset.maxValue / 3))
    .visualize({min:0, max:dataset.maxValue, palette: colors})
    .set({label: date.format('YYYY-MM-dd HH:mm')})
}


print(ui.Chart.image.series({
  imageCollection: dataset.images.filterDate(startDate, ee.Date(startDate).advance(maxHours, 'hour')).select(dataset.var), 
  region: geometry2, 
  reducer: ee.Reducer.max(), 
  scale: 1000
}))

var frames = dataset.images.filterDate(startDate, ee.Date(startDate).advance(maxHours, 'hour')).select(dataset.var).map(render);
animation.animate(frames, {maxFrames: 150, label: 'label'})

style.SetMapStyleDark()