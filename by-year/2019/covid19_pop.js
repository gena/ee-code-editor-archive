/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gadm = ee.FeatureCollection("users/gena/GADM36"),
    geometry = /* color: #d63000 */ee.Geometry.Point([4.482350206107739, 51.91885256731724]),
    covid19_adm1 = ee.FeatureCollection("users/gena/covid19/covid19_adm1"),
    covid19 = ee.FeatureCollection("users/gena/covid19/covid19"),
    covid19_adm2 = ee.FeatureCollection("users/gena/covid19/covid19_adm2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// 1. Centers and polygons of countries
// 2. Centers and polygons of regions
// 3. Centers and polygons of cities

var pop = ee.ImageCollection("WorldPop/GP/100m/pop").filter(ee.Filter.eq('year', 2020)).sum()
Map.addLayer(pop, { min: 0, max: 60}, 'population', false, 0.5)

Map.addLayer(gadm, {}, 'gadm (raw)', false)
// Map.addLayer(gadm.style({width: 1, color: 'ffffffaa', fillColor: '00000033'}), {}, 'gadm', false)

// Map.addLayer(gadm.filterBounds(covid19_adm2.filter(ee.Filter.gt('Confirmed', 0)).geometry()).style({color: '15151577', width: 1, fillColor: '15151555'}), {}, 'gadm', false)

var g = gadm.filterBounds(geometry).geometry()
print(pop.reduceRegion(ee.Reducer.sum(), g, 100))


Map.addLayer(covid19, { color: 'red' }, 'covid19', false)
Map.addLayer(covid19_adm1, { color: 'blue' }, 'covid19_adm1', false)
Map.addLayer(covid19_adm2, { color: 'green' }, 'covid19_adm2', false)

var style = require('users/gena/packages:style')
var palettes = require('users/gena/packages:palettes')

var paletteRecovered = Array.from({ length: 100 }).map(function(x) { return '31a354' })
var paletteDeaths = Array.from({ length: 100 }).map(function(x) { return '000000' })
var paletteConfirmed = Array.from({ length: 100 }).map(function(x) { return 'e31a1c' })

function render(features, name) {
  features = features.map(function(f) {
    return f.set({
      conf_r: ee.Number(f.get('Confirmed')).sqrt(),
      dr_r: ee.Number(f.get('Recovered')).sqrt(),
      deaths_r: ee.Number(f.get('Deaths')).sqrt(),
    })
  })
  
  var confirmedMax_r = 260.357446599862
  
  style.SetMapStyleDark(Map)

  var opacityLine = 1
  
  var imageConfirmed = style.Feature.linear(features.filter(ee.Filter.gt('Confirmed', 0)), 'conf_r',
      { palette: paletteConfirmed, pointSizeMin: 1, pointSizeMax: 50, width: 1, opacity: 0.5, opacityLine: opacityLine, valueMin: 1, valueMax: confirmedMax_r })  
  
  var imageDeathsAndRecovered = style.Feature.linear(features.filter(ee.Filter.gt('Recovered', 0)), 'dr_r',
      { palette: paletteRecovered, pointSizeMin: 1, pointSizeMax: 50, width: 1, opacity: 0.5, opacityLine: opacityLine, valueMin: 1, valueMax: confirmedMax_r })  
  
  var imageDeaths = style.Feature.linear(features.filter(ee.Filter.gt('Deaths', 0)), 'deaths_r',
      { palette: paletteDeaths, pointSizeMin: 1, pointSizeMax: 50, width: 1, opacity: 0.5, opacityLine: opacityLine, valueMin: 1, valueMax: confirmedMax_r })  
  
  
  var adm = gadm.filterBounds(features.filter(ee.Filter.gt('Confirmed', 0)).geometry()).style({color: '15151577', width: 1, fillColor: '15151555'})
  
  var image = adm.blend(imageConfirmed).blend(imageDeathsAndRecovered).blend(imageDeaths)
 
  return ui.Map.Layer(image, {}, name)
}

// Map.layers().add(render(ee.FeatureCollection('users/gena/covid19/covid19_adm2_03_22_2020'), '03-22-3030'))
Map.layers().add(render(ee.FeatureCollection('users/gena/covid19/covid19_adm2_23_03_2020'), '03-23-3030'))
Map.layers().add(render(ee.FeatureCollection('users/gena/covid19/covid19_adm2_24_03_2020'), '03-24-3030'))

// var layer1 = render(covid19_adm1, 'covid19 adm1')
// var layer2 = render(covid19_adm2, 'covid19 adm2')

// layer2.setShown(false)

// Map.layers().add(layer1)
// Map.layers().add(layer2)

// Map.onChangeZoom(function(zoom) {
//   if(zoom <= 4 && layer2.getShown()) {
//     layer1.setShown(true)
//     layer2.setShown(false)
//   }

//   if(zoom > 4 && layer1.getShown()) {
//     layer1.setShown(false)
//     layer2.setShown(true)
//   }
// })
