/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var aster = ee.ImageCollection("ASTER/AST_L1T_003"),
    geometry = /* color: d63000 */ee.Geometry.Point([-120.15498161315918, 39.38141608560946]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// add ASTER images
var images = aster
  .filterBounds(geometry)
  .select(['B09', 'B3N', 'B02'])
  .filter(ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B09'))
  .filter(ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B3N'))
  .filter(ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B02'))

Map.addLayer(images, {}, 'all', false)

print(images.first())

var count = images.select(0).aggregate_count('system:id')
print('ASTER', count)

var count = 50
var list = images.toList(count, 0)
for(var i=0; i<count; i++) {
  var image = ee.Image(list.get(i))
  Map.addLayer(image, {}, ee.Date(image.get('system:time_start')).format('YYYY-MM-dd').getInfo(), i===0)
}
