// import text utils
var text = require('users/gena/packages:text')

// get a random image
var image = ee.Image(ee.ImageCollection('COPERNICUS/S2').filterBounds(Map.getCenter()).first())

// define a set of image annotations (text strings) and their properties
var annotations = [
  {
    position: 'top', offset: '50%', margin: '0.5%',
    property: 'system:time_start',
    text: {fontSize: 32, outlineWidth: 4, outlineOpacity: 0.4, textColor: 'edf8e9'},
    format: function(o) { return ee.Date(o).format('YYYY-MM-dd') }
  },
  {
    position: 'left', offset: '80%', margin: '0.5%',
    property: 'MEAN_SOLAR_ZENITH_ANGLE',
    text: {fontSize: 18, outlineWidth: 3, outlineOpacity: 0.6},
    format: function(o) { return ee.Number(o).format('Zenith: %.1f degree') }
  },
  {
    position: 'left', offset: '85%', margin: '0.5%',
    property: 'MEAN_SOLAR_AZIMUTH_ANGLE',
    text: {fontSize: 18, outlineWidth: 3, outlineOpacity: 0.6},
    format: function(o) { return ee.Number(o).format('Azimuth: %.1f degree') }
  },
  {
    position: 'left', offset: '90%', margin: '0.5%',
    property: 'system:index',
    text: {fontSize: 32, outlineWidth: 3, outlineOpacity: 0.6, textColor: 'ffffb2'},
    format: function(o) { return ee.String('ID: ').cat(o) }
  },
]

var vis = {min: 2000, max: 5000, gamma: 1.4, bands: ['B12', 'B8', 'B5']}
var bounds = Map.getBounds(true)

// annotate image
var annotated = text.annotateImage(image, vis, bounds, annotations)

// add to map
Map.addLayer(annotated, {}, 'image, annotated')

