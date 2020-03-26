var hydro = require('users/gena/packages:hydro')

var dem = hydro.Map.addDem({layer: {visible: true, name: 'DEM'}})
var occurrence = hydro.Map.addWaterOccurrence({type: 'JRC', layer: {visible: true, name: 'JRC (1984-2015)'}})


