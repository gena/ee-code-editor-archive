var l2 = new ee.ImageCollection('LANDSAT/LM2_L1T')
    .filter(ee.Filter.inList('LANDSAT_SCENE_ID', [
      'LM20160321977285GMD03', 'LM20160321977357AAA02', 'LM20350381977286GDS03',
      'LM20350381977286GDS03', 'LM20350381977322GDS03', 'LM20350381977340GDS03',
      'LM20400331981036AAA04', 'LM20360371977197GDS03', 'LM20360381977161GDS06',
      'LM20360381977251GDS03', 'LM20360381977287GDS03', 'LM20400331981036AAA04']).not())

var l3 = new ee.ImageCollection('LANDSAT/LM3_L1T')
    .filter(ee.Filter.inList('LANDSAT_SCENE_ID', [
      'LM30950891982095ASA00', 'LM30360121982216PAC00', 'LM30910241982163AAA03',
      'LM30950891982095ASA00', 'LM30910241982163AAA03', 'LM30950891982095ASA00',
      'LM30020661982110XXX01', 'LM30100131982190PAC00', 'LM30040471983089XXX01',
      'LM30050471982347AAA03', 'LM31090631983051AAA05', 'LM30180131983067XXX01',
      'LM30230471983036AAA03', 'LM31520411983058XXX03', 'LM30440131983057AAA05',
      'LM30100621983059XXX02', 'LM30950891982095ASA00', 'LM30440131983057AAA05',
      'LM30100621983059XXX02', 'LM30180131983067XXX01', 'LM30040471983089XXX01',
      'LM31110281983089HAJ00', 'LM30230471983036AAA03', 'LM31110281983089HAJ00',
      'LM31520411983058XXX03', 'LM31090631983051AAA05', 'LM32010241980213AAA06',
      'LM30950891982095ASA00', 'LM30220451982094AAA03', 'LM30950891982095ASA00',
      'LM30050471982347AAA03', 'LM30100131982190PAC00', 'LM30950891982095ASA00',
      'LM30020661982110XXX01', 'LM30950891982095ASA00', 'LM30950781982113ASA00',
      'LM30360121982216PAC00', 'LM30950891982095ASA00', 'LM30950781982113ASA00',
      'LM30950891982095ASA00', 'LM30220451982094AAA03']).not())

var images = l3.map(function(i) {
  return i.updateMask(i.select('B7').gt(2).multiply(i.select('B4').gt(2)).multiply(i.select('B5').gt(2)))
})

var vis = {min:10, max:70}

var p = images.select(['B7', 'B6', 'B5']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '765', false)

var p = images.select(['B7', 'B6', 'B4']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '764', false)

var p = images.select(['B7', 'B5', 'B6']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '756', false)

var p = images.select(['B7', 'B5', 'B4']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '754', false)

var p = images.select(['B7', 'B4', 'B6']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '746', false)

var p = images.select(['B7', 'B4', 'B5']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '745', false)

var p = images.select(['B6', 'B7', 'B5']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '675', false)

var p = images.select(['B6', 'B7', 'B4']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '674', false)

var p = images.select(['B6', 'B5', 'B7']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '657', false)

var p = images.select(['B6', 'B5', 'B4']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '654', false)

var p = images.select(['B6', 'B4', 'B7']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '647', false)

var p = images.select(['B6', 'B4', 'B5']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '645', false)

var p = images.select(['B5', 'B7', 'B6']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '576', false)

var p = images.select(['B5', 'B7', 'B4']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '574', true) // good

var p = images.select(['B5', 'B6', 'B7']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '567', false)

var p = images.select(['B5', 'B6', 'B4']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '564', false) // good

var p = images.select(['B5', 'B4', 'B7']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '547', false)

var p = images.select(['B5', 'B4', 'B6']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '546', false)

var p = images.select(['B4', 'B7', 'B6']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '476', false)

var p = images.select(['B4', 'B7', 'B5']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '475', false)

var p = images.select(['B4', 'B6', 'B7']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '467', false)

var p = images.select(['B4', 'B6', 'B5']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '465', false)

var p = images.select(['B4', 'B5', 'B7']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '457', false)

var p = images.select(['B4', 'B5', 'B6']).reduce(ee.Reducer.percentile([15]), 4)
Map.addLayer(p, vis, '456', false)

