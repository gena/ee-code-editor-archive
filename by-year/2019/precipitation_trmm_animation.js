/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var south = /* color: #0b4a8b */ee.Geometry.Polygon(
        [[[12.3046875, -10.83330598364249],
          [9.84375, -17.308687886770024],
          [11.953125, -20.797201434306984],
          [16.875, -35.46066995149529],
          [35.859375, -33.72433966174759],
          [43.2421875, -7.710991655433216],
          [29.53125, -6.227933930268673],
          [17.2265625, -5.528510525692789],
          [10.546875, -5.615985819155327]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var palettes = require('users/gena/packages:colorbrewer').Palettes
var animation = require('users/gena/packages:animation')

var images = ee.ImageCollection('TRMM/3B42').select('precipitation')
  .filterDate('2016-01-01', '2019-01-01')
  .map(function(i) { return i.resample('bilinear')})

function getDates(start, stop, step) {
  return ee.List.sequence(start, stop).map(function(year) {
    return ee.List.sequence(1, 12, step).map(function(month) {
      return ee.Date.fromYMD(year, month, 1)
    })
  }).flatten()
}

// convert to monthly average
function toMonthly(images) {
  var dates = getDates(2016, 2017, 1)
  
  return ee.ImageCollection(dates.map(function(d) {
    d = ee.Date(d)
    
    var p = images
      .filterDate(d, d.advance(1, 'month'))
      .mean()
      .set('system:time_start', d.millis())
    
    return p
  }))
}

// comment this line to show original images
images = toMonthly(images)

// visualize
images = images.map(function(i) {
  return i.mask(i.multiply(2))
    .visualize({min: 0, max: 1, palette: palettes.Blues[9]})
    .set({label: i.date().format('YYYY-MM-dd HH:mm')})
   // .clip(south.bounds())
})

Map.addLayer(ee.Image(1), {palette: ['000000']}, 'black', true, 0.5)

animation.animate(images, { maxFrames: 24, label: 'label' })

