function renderBasins(fusionTableId) {
  var fc = new ee.FeatureCollection('ft:' + fusionTableId);
  
  var image = ee.Image(0).mask(0).toByte();
  image = image.paint(fc, 1).paint(fc, 2, 1);
  return image.clip(fc).visualize({min:1, max:2, palette:['000000', 'bbbbbb'], opacity: 1.0});
}

function renderRivers(fusionTableId) {
  var fc = new ee.FeatureCollection('ft:' + fusionTableId);

  var rivers = [
    fc.filter(ee.Filter.gt('UP_CELLS', 0).and(ee.Filter.lte('UP_CELLS', 1000))),
    fc.filter(ee.Filter.gt('UP_CELLS', 1000).and(ee.Filter.lte('UP_CELLS', 10000))), 
    fc.filter(ee.Filter.gt('UP_CELLS', 10000).and(ee.Filter.lte('UP_CELLS', 100000))),
    fc.filter(ee.Filter.gt('UP_CELLS', 100000).and(ee.Filter.lte('UP_CELLS', 500000))),
    fc.filter(ee.Filter.gt('UP_CELLS', 500000).and(ee.Filter.lte('UP_CELLS', 2000000))),
    fc.filter(ee.Filter.gt('UP_CELLS', 2000000).and(ee.Filter.lte('UP_CELLS', 5000000)))
  ];

  var rivers_image = ee.Image(0).mask(0).toByte();
  var size_multiplier = 0.1
  for(var i=0; i<rivers.length; i++) {
    rivers_image = rivers_image.paint(rivers[i], i, i*size_multiplier + 1);
  }

  return rivers_image.mask(ee.Image(rivers_image.mask().multiply(0.7))).visualize({palette:['#AAAAEE']});
}

Map.addLayer(renderBasins('13dShZ5yGqCEqk3dsJvYEL3lsa1hEmpMRldxK7aSa'), {opacity:0.8}, 'basins')
Map.addLayer(renderRivers('1xfvGA2mK7nNrt0S7asJR-lZXDa5fOPAgCsxUlM17'), {}, 'rivers AU')
Map.addLayer(renderRivers('15-WpLuijWukjWsjUral2RFZXx0IR7j2lLTAi8lR9'), {}, 'rivers, UP_CELLS > 16000')

