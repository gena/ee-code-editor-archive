/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var occurrence = ee.Image("users/gena/water-occurrence-Prosser-Creek-2000-01-01_2017-04-01_Sterkfontein");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var Palettes = {
    water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b']
};

var mask = occurrence.mask()

occurrence = occurrence.unmask(0, false).mask(mask.focal_max(20, 'square', 'meters'))

Map.addLayer(occurrence
  .unmask(0, false).resample('bicubic')
  .mask(mask.focal_mode(10, 'circle', 'meters', 3))
  , {palette: Palettes.water}, 'opccurrence (smoothed)', false)


Map.addLayer(occurrence, {palette: Palettes.water}, 'opccurrence')

Map.addLayer(ee.Image(1).int(), {palette: '000000'}, 'black', true, 0.5)

ee.List.sequence(0.1, 0.9, 0.1).getInfo(function(levels) {
  levels.map(function(i) {
    var iso = occurrence
      .resample('bicubic')
      .subtract(ee.Image.constant(i)).zeroCrossing()
    Map.addLayer(iso.mask(iso), {palette: '31a354'}, i.toString())
  })
})


Map.setOptions('SATELLITE')