var palettes = require('users/gena/packages:colorbrewer').Palettes

var images = ee.ImageCollection('COPERNICUS/S1_GRD')

var now = ee.Date(new Date().getTime())
var t0 = now.advance(-10, 'day')

function addCount(band) {
  var i = images
    .filterDate(t0, now)
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band))

  Map.addLayer(i.select(band).count(), {min: 0, max: 5, palette: palettes.RdYlGn[5]}, band)
}

addCount('VV')
addCount('VH')
addCount('HH')
addCount('HV')
