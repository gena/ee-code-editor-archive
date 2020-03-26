/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #98ff00 */ee.Geometry.Polygon(
        [[[-44.11810199539809, -20.121660866276986],
          [-44.11941091476302, -20.120975833617525],
          [-44.120247769031494, -20.119787089371975],
          [-44.12091295181136, -20.118920716409125],
          [-44.1215137666307, -20.11734913797046],
          [-44.12271539626937, -20.118759529603675],
          [-44.12202875076156, -20.12069376030548],
          [-44.12001172958236, -20.122184713478063]]]),
    gradient = /* color: #0b4a8b */ee.Geometry.LineString(
        [[-44.12141839440301, -20.124592371359082],
         [-44.11519566948846, -20.123867055731836]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var palettes = require('users/gena/packages:palettes');
var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')
var style = require('users/gena/packages:style')

// var region = Map.getBounds(true)
var region = geometry

var images = assets.getImages(region, {
  missions: ['L5', 'L7', 'L8'],
  includeTemperature: true,
  filter: ee.Filter.date('2015-01-01', '2020-01-01')
})

images = assets.getMostlyCleanImages(images, region)
  
var temp = images  
  .select('temp')
  .sort('system:time_start')

print(ui.Chart.image.series({
  imageCollection: temp, 
  region: geometry, 
  reducer: ee.Reducer.mean(), 
  scale: 50
}).setOptions({ pointSize: 3, lineWidth: 0 }))

function printChart() {
  var variable = 'temp'
  
  var timeSeries = temp.map(function(i) {
      var values = i.reduceRegion({
        reducer: ee.Reducer.percentile([2, 50, 98]), 
        geometry: region, 
        scale: 60
      })
      
      return ee.Feature(null, values)
        .set({ 'system:time_start': i.get('system:time_start') })
  })  
  
  timeSeries = ee.FeatureCollection(timeSeries)
  
  var properties = [variable + '_p2', variable + '_p50', variable + '_p98']

  timeSeries.select(['system:time_start'].concat(properties)).evaluate(function(ts) {
    var dataTable = {
      cols: [{id: 'x', type: 'date'},
             {id: 'y', type: 'number'},
             {id: 'i0', type: 'number', role: 'interval'},
             {id: 'i1', type: 'number', role: 'interval'}]
    };
    
    var values = ts.features.map(function(f) {
      var p = f.properties
      return [ new Date(p['system:time_start']), p[variable + '_p50'], p[variable + '_p2'], p[variable + '_p98'] ]
    })
    
    dataTable.rows = values.map(function(row) {
      return { c: row.map(function(o) { return { v: o } }) }
    })
    
    var options = {  
        title: variable,  
        curveType:'function',  
        series: [{'color': '#000000'}],  
        intervals: { 'style':'area' },  
        legend: 'none',  
    };  
    
    print(ui.Chart(dataTable, 'LineChart', options));
  })
}

printChart()

temp = temp.map(function(t) {
  return t.updateMask(t.unitScale(293, 297))
})

animation.animate(temp, {
  vis: { min: 290, max: 300, palette: palettes.colorbrewer.RdYlBu[9].slice(0).reverse() }
})

temp = temp.map(function(i) { return i.resample('bilinear') })

// add a gradient bar
var min = 5
var max = 20

var v = temp.reduce(ee.Reducer.variance())
v = v.updateMask(v.unitScale(min, min + (max - min)/3))

var p = palettes.matplotlib.inferno[7]

Map.addLayer(v, { min: min, max: max, palette: p })

var textProperties = { fontSize:16, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2, outlineOpacity: 0.6 }

var labels = ee.List.sequence(min, max, ee.Number(max).subtract(min).divide(5))
var gradient = style.GradientBar.draw(gradient, {
  min: min, max: max, palette: p, labels: labels, format: '%.0f', textProperties: textProperties
})
Map.addLayer(gradient, {}, 'gradient bar')
