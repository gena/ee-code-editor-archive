/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    pt1 = /* color: #d63000 */ee.Geometry.Point([-80.36558032852645, 26.134622880000357]),
    pt2 = /* color: #98ff00 */ee.Geometry.Point([-80.32964200507666, 26.16743973151638]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var animation = require('users/gena/packages:animation')
var assets = require('users/gena/packages:assets')

var images = s1
  .filterDate('2017-01-01', '2020-01-01')
  .filterBounds(Map.getCenter())
  .map(function(i) {
    
    var pol = ee.List(i.get('transmitterReceiverPolarisation'))
    var b1 = pol.get(0)
    var b2 = pol.get(1)
    
    var im = toNatural(i.select([0, 1]).rename(['b1', 'b2']))
    return im
      .set({label: i.date().format().cat(', ').cat(b1).cat(' ').cat(b2) })
  })
  
// plot over points  
print(ui.Chart.image.series(images, pt1.buffer(Map.getScale() * 10), ee.Reducer.median(), 10))
print(ui.Chart.image.series(images, pt2.buffer(Map.getScale() * 10), ee.Reducer.median(), 10))
  
print(images.size())  
var med = images.median()
var mea = images.mean()
Map.addLayer(ee.Image([mea.select(0), med.select(0), mea.select(1)]), {min: 0, max: 0.4, gamma: 1.5}, 'composite', false)

images = images.map(function(i) {
  var diff = i.select(0).subtract(i.select(1))
  return ee.Image([i.select(0), i.select(1), diff]).visualize({min: 0, max: [0.5, 0.25, 0.1], gamma: 1.5})
  
  // var t = ee.Date(i.date())
  // var med = images.filterDate(t, t.advance(30, 'day')).median()
  //return ee.Image([i.select(0), med.select(0), i.select(1)]).visualize({min: 0, max: 0.4, gamma: 1.5})
  
    .set({ label: i.get('label')})
})

print(images.first())

// animation.animate(images, {vis: {min: -25, max: 0, bands: ['b1', 'b1', 'b2']}, label: 'label', maxFrames: 71})
animation.animate(images, { label: 'label', maxFrames: 71})

// Functions to convert from dB
function toNatural(i) {
  return ee.Image(ee.Image.constant(10.0).pow(i.divide(10.0)).copyProperties(i, ['system:time_start']));
}

