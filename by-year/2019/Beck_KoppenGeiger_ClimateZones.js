/*

https://figshare.com/articles/Present_and_future_K_ppen-Geiger_climate_classification_maps_at_1-km_resolution/6396959/2

Legend linking the numeric values in the maps to the Köppen-Geiger classes.
The RGB colors used in Beck et al. [2018] are provided between parentheses.

    1:  Af   Tropical, rainforest                  [0 0 255]
    2:  Am   Tropical, monsoon                     [0 120 255]
    3:  Aw   Tropical, savannah                    [70 170 250]
    4:  BWh  Arid, desert, hot                     [255 0 0]
    5:  BWk  Arid, desert, cold                    [255 150 150]
    6:  BSh  Arid, steppe, hot                     [245 165 0]
    7:  BSk  Arid, steppe, cold                    [255 220 100]
    8:  Csa  Temperate, dry summer, hot summer     [255 255 0]
    9:  Csb  Temperate, dry summer, warm summer    [200 200 0]
    10: Csc  Temperate, dry summer, cold summer    [150 150 0]
    11: Cwa  Temperate, dry winter, hot summer     [150 255 150]
    12: Cwb  Temperate, dry winter, warm summer    [100 200 100]
    13: Cwc  Temperate, dry winter, cold summer    [50 150 50]
    14: Cfa  Temperate, no dry season, hot summer  [200 255 80]
    15: Cfb  Temperate, no dry season, warm summer [100 255 80]
    16: Cfc  Temperate, no dry season, cold summer [50 200 0]
    17: Dsa  Cold, dry summer, hot summer          [255 0 255]
    18: Dsb  Cold, dry summer, warm summer         [200 0 200]
    19: Dsc  Cold, dry summer, cold summer         [150 50 150]
    20: Dsd  Cold, dry summer, very cold winter    [150 100 150]
    21: Dwa  Cold, dry winter, hot summer          [170 175 255]
    22: Dwb  Cold, dry winter, warm summer         [90 120 220]
    23: Dwc  Cold, dry winter, cold summer         [75 80 180]
    24: Dwd  Cold, dry winter, very cold winter    [50 0 135]
    25: Dfa  Cold, no dry season, hot summer       [0 255 255]
    26: Dfb  Cold, no dry season, warm summer      [55 200 255]
    27: Dfc  Cold, no dry season, cold summer      [0 125 125]
    28: Dfd  Cold, no dry season, very cold winter [0 70 95]
    29: ET   Polar, tundra                         [178 178 178]
    30: EF   Polar, frost                          [102 102 102]

Please cite Beck et al. [2018] when using the maps in any publication:

    Beck, H.E., N.E. Zimmermann, T.R. McVicar, N. Vergopolan, A. Berg, E.F. Wood:
    Present and future Köppen-Geiger climate classification maps at 1-km resolution,
    Nature Scientific Data, 2018.


*/

var palette = ['0000ff', '0078ff', '46aafa', 'ff0000','ff9696', 'f5a500', 'ffdc64',
  'ffff00', 'c8c800', '969600', '96ff96', '64c864', '329632', 'c8ff50', '64ff50',
'32c800', 'ff00ff', 'c800c8', '963296', '966496', 'aaafff', '5a78dc', '4b50b4',
'320087', '00ffff', '37c8ff', '007d7d', '00465f', 'b2b2b2','666666']

var scale = 4000
var image = ee.Image('users/gena/Beck_KG_V1/present_0p0083')
  .focal_mode(3 * scale, 'circle', 'meters', 2)
  
print(image.projection())


Map.addLayer(image.selfMask(), { min: 1, max: 30, palette: palette }, 'climate zones', true, 0.6)

Map.setOptions('HYBRID')


// remap to coarse:

var imageMajor = image.remap(ee.List.sequence(1,30),
  [
    1,1,1, // Tropical
    2,2,2,2, // Arid
    3,3,3,3,3,3,3,3,3, // Temperate
    4,4,4,4,4,4,4,4,4,4,4,4, // Cold
    5,5 // Polar
  ])
  
palette = ['46aafa', 'ff0000', 'c8c800', '007d7d', 'b2b2b2']

Map.addLayer(imageMajor.selfMask(), { min: 1, max: 5, palette: palette}, 'climate zones (coarse)', false, 0.5)

// Map.setCenter(0, 15, 3)

image = image.rename('KG')
imageMajor = imageMajor.rename('KG_MAJOR')

var climateZones = image.addBands(imageMajor)

var global = ee.Geometry.Polygon([[180,85],[0,85],[-180,85],[-180,-85],[0,-85],[180,-85],[180,85]], 'EPSG:4326', false)
//var global = ee.Geometry(Map.getBounds(true))

var climateZonesVector = imageMajor.reduceToVectors({
  // reducer: ee.Reducer.first(), 
  geometry: global, 
  scale: scale, 
  eightConnected: true, 
  crs: 'EPSG:4326',
  maxPixels: 1e10, 
  tileScale: 8
})

Map.addLayer(climateZonesVector)

Export.table.toAsset(climateZonesVector, 'climate_zones', 'users/gena/Beck_KG_V1_vector_major')