var years = ee.List.sequence(1995, 2014)
var images = ee.ImageCollection('JRC/GSW1_0/YearlyHistory')
var lakes = ee.FeatureCollection('users/michaelfrederickmeyer/HydroLAKES_whole')
  .map(function(f) { return f.buffer(90) })

years.evaluate(function(years) {
  years.map(function(y) {
    var t1 = ee.Date.fromYMD(y, 1, 1)
    var t2 = t1.advance(1, 'year')
  
    var water = images.filterDate(t1, t2).first()
    var image = ee.Image.pixelArea().addBands(water)
    
    var area = lakes.map(function(feature) {
      return feature.set(image.reduceRegion({
        reducer: ee.Reducer.sum().group({
          groupField: 1,
          groupName: 'waterClass',
        }),
        geometry: feature.geometry(),
        scale: 10,
        maxPixels: 1e12
      }));
    });
  
    Export.table.toDrive({ 
      collection: area,
      description: 'JRC_waterclass_areas_' + y,
      folder: '90_m_buffer_all',
      fileFormat: 'CSV',
      selectors: ['Hylak_id','groups'] 
    });
  })
})
