/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table = ee.FeatureCollection("projects/WRI-Aquaduct/Y2018M04D20_RH_Ingest_HydroBasins_GCS_EE_V01/output_V02/hybas_lev00_v1c_merged_fiona_V04");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// converting HydroBASINS to a multi-band image


var properties = [
  { name: 'HYBAS_ID', type: 'int64' },

  { name: 'DIST_MAIN', type: 'float' },
  { name: 'DIST_SINK', type: 'float' },
  { name: 'SUB_AREA', type: 'float' },
  { name: 'UP_AREA', type: 'float' },

  { name: 'ENDO', type: 'byte' },
  { name: 'COAST', type: 'byte' },
  { name: 'ORDER', type: 'byte' },

  { name: 'SORT', type: 'int64' },

  { name: 'MAIN_BAS', type: 'int64' },
  { name: 'NEXT_DOWN', type: 'int64' },
  { name: 'NEXT_SINK', type: 'int64' },

  { name: 'PFAF_1', type: 'int64' },
  { name: 'PFAF_2', type: 'int64' },
  { name: 'PFAF_3', type: 'int64' },
  { name: 'PFAF_4', type: 'int64' },
  { name: 'PFAF_5', type: 'int64' },
  { name: 'PFAF_6', type: 'int64' },
  { name: 'PFAF_7', type: 'int64' },
  { name: 'PFAF_8', type: 'int64' },
  { name: 'PFAF_9', type: 'int64' },
  { name: 'PFAF_10', type: 'int64' },
  { name: 'PFAF_11', type: 'int64' },
  { name: 'PFAF_12', type: 'int64' }
]

Map.addLayer(table)

var images = [] 
properties.map(function(p) {
  var name = p.name
  var type = p.type
  var i = ee.Image(table.reduceToImage([name], ee.Reducer.first()))[type]().rename(name)
  
  images.push(i)
})

var image = images[0]
images.slice(1).map(function(i) {
  image = image.addBands(i)
})

var crs = "EPSG:4326"

var crsTransform = [
  0.0041666666666667,
  0,
  -180,
  0,
  -0.0041666666666667,
  90
]

var pyramidingPolicy = {
  'HYBAS_ID': 'mode',

  'DIST_MAIN': 'max',
  'DIST_SINK': 'max',
  'SUB_AREA': 'max',
  'UP_AREA': 'max',

  'ENDO': 'mode',
  'COAST': 'mode',
  'ORDER': 'mode',

  'SORT': 'mode',

  'MAIN_BAS': 'mode',
  'NEXT_DOWN': 'mode',
  'NEXT_SINK': 'mode',

  'PFAF_1': 'mode',
  'PFAF_2': 'mode',
  'PFAF_3': 'mode',
  'PFAF_4': 'mode',
  'PFAF_5': 'mode',
  'PFAF_6': 'mode',
  'PFAF_7': 'mode',
  'PFAF_8': 'mode',
  'PFAF_9': 'mode',
  'PFAF_10': 'mode',
  'PFAF_11': 'mode',
  'PFAF_12': 'mode',
}

Export.image.toAsset({
  image: image, 
  description: 'HydroBASINS_all', 
  assetId: 'users/gena/HydroBASINS', 
  pyramidingPolicy: pyramidingPolicy, 
  crs: crs, 
  crsTransform: crsTransform
})

Map.addLayer(image.select('HYBAS_ID').reproject(crs, crsTransform).randomVisualizer())

Map.addLayer(image.select('PFAF_6').reproject(crs, crsTransform).randomVisualizer())
