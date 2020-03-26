var assets = [
  'LANDSAT/LC8_L1T_TOA', // FAIL
  //'LANDSAT/LE7_L1T_TOA', // FAIL
  //'LANDSAT/LT5_L1T_TOA',
  //'LANDSAT/LT4_L1T_TOA', // OK
  //'COPERNICUS/S2', // OK
  //'ASTER/AST_L1T_003', // FAIL
  //'COPERNICUS/S1_GRD' // OK if only 4 vertices are allowed, otherwise fail (mismatch > tolerance)?
]

assets.map(function(asset) {
  var bad = ee.ImageCollection(asset)
    .filterBounds(Map.getBounds(true))
    .map(function(i) {
      var tolerance = 3000 // allowed mismatch in meters
     
      if(asset === 'LANDSAT/LT5_L1T_TOA') {
        tolerance = 6000 // spikes at the image edges
      }
      
      var geometryMask = ee.Image().int().paint(i.geometry().buffer(-tolerance), 1)
      var firstBandMask = i.select(0).mask().int()
      
      // fill in SLC-OFF for L7
      if(asset === 'LANDSAT/LE7_L1T_TOA') {
        firstBandMask = firstBandMask
          .focal_max(tolerance, 'square', 'meters')
      }
      
      // fix ASTER, 0-band can be empty
      if(asset === 'ASTER/AST_L1T_003') {
        firstBandMask = i.mask().reduce(ee.Reducer.anyNonZero()).int()
      }
      
      return geometryMask.bitwiseXor(firstBandMask).mask(geometryMask)
        .set('geometry', i.geometry())
        .set('system:index', i.get('system:index'))
    })
  
  var total = bad.sum()
  Map.addLayer(total.mask(total), {min: 0, max:10, palette:['ffffff', 'ff0000']}, asset)

  // identify bad scenes
  var badImages = bad.map(function(i) {
    var broken = i
      .unmask() // why it fails without mask?
      .reduceRegion(ee.Reducer.anyNonZero(), i.get('geometry'), 3000).values().get(0)
      
    return i.set('BROKEN', broken)
  }).filter(ee.Filter.neq('BROKEN', 0))

  print(badImages.limit(5).aggregate_array('system:index'))

  Map.addLayer(badImages, {}, 'bad images', false) // for inspector
})

