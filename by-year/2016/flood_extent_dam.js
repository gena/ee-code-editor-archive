/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var fa = ee.Image("WWF/HydroSHEDS/15ACC"),
    dam = /* color: 0022a5 */ee.Geometry.Point([-114.53238487243652, 36.64232904553789]),
    ldd = ee.Image("WWF/HydroSHEDS/15DIR"),
    hand = ee.ImageCollection("users/gena/global-hand/hand-100"),
    srtm30 = ee.Image("USGS/SRTMGL1_003");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Author: Gennadii Donchyts (gennadiy.donchyts@deltares.nl)
// License: LGPL

// HydroBASINS, homogenized, size < 4 degree
var basinsByContinent = {
  'na': ee.FeatureCollection('ft:1HAbBuf18oeZ1u9ywawDXHZSSx1aqPBvmjeSbOyQw'),
  'sa': ee.FeatureCollection('ft:1b8FEG5pjIRkj_SgkIzGEFG_ImTlqoqt0cgCpuFPP'),
  'eu': ee.FeatureCollection('ft:1MEAjk9ExAKNksJNjdmTfKPuPVtAj-ppE_PCP-qen'),
  'as': ee.FeatureCollection('ft:166Y2S94c9pZSqqCsyT5-n0d42CNuW5ixobWOwMxl')
}

/***
 * Selects all upstream catchments using Pfaffstetter coding (or alternative) mathod.
 */ 
function selectUpstreamCatchments(geometry, catchments) {
  // TODO: impement using features or rasters
  return catchments.filterBounds(geometry)
}

// select basin boundaries for North America
var basins = basinsByContinent['na']

Map.addLayer(basins, {}, 'all basins', false)

// select basin which intersects with a given geometry
var selectedBasin = selectUpstreamCatchments(dam, basins)

Map.addLayer(selectedBasin, {color:'00aa00', opacity:0.5}, 'selected basin', false)

// clip HAND by selected catchment
hand = hand.mosaic()
var hand = hand.clip(selectedBasin)

Map.addLayer(hand, {min:0, max:100}, 'HAND', false)

// define max DAM water level
var waterLevel = 30

// compute flood extent using HAND
var floodHand = hand.lt(waterLevel)

Map.addLayer(floodHand.mask(floodHand), {palette:['5050ff'], opacity:0.5}, 'flood mask (HAND)', false)

// compute max flood extent using DEM
var elevationDam = ee.Dictionary(srtm30.reduceRegion(ee.Reducer.first(), dam, 30)).values().get(0)
var floodDem = srtm30.clip(selectedBasin).gte(ee.Number(elevationDam))
  .multiply(srtm30.clip(selectedBasin).lte(ee.Number(elevationDam).add(waterLevel)))

Map.addLayer(floodDem.mask(floodDem), {palette:['5050ff'], opacity:0.6}, 'flood mask (DEM)', false)

// intersect DEM and HAND estimates
var flood = floodDem.multiply(floodHand) // clip by max flood extend using HAND
flood = flood.mask(flood)

Map.addLayer(flood, {}, 'flood (all)', false)

// take only blob intersecting with DAM
var blobs = flood.connectedComponents(ee.Kernel.plus(1), 256).reproject('EPSG:4326', null, 60).select('labels')
var blobLabel = ee.Dictionary(blobs.reduceRegion(ee.Reducer.first(), dam, 30)).values().get(0)
flood = blobs.eq(ee.Number(blobLabel))

Map.addLayer(blobs, {}, 'blobs', false)
Map.addLayer(flood.mask(flood), {palette:['5050ff'], opacity:0.5}, 'flood mask')



// ============================================================================
// a better algorithm requires iterative, single raster algorithms within EE


/***
 * Given point, determine upstream subcatchment by tracing along drainage directions.
 */
function catchment(sinks, ldd) {
  // 1=E, 2=SE, 4=S, 8=SW, 16=W, 32=NW, 64=N, 128=NE.
  
  // TODO: implement recursive tracing using LDD, maybe using JGrass Java?
  
}

// add flow accumulation
var faBasin = fa.clip(selectedBasin)
Map.addLayer(faBasin, {min:0, max:100000}, 'selected basin flow accumulation', false)

// add local drainage directions
var lddBasin = ldd.clip(selectedBasin)
Map.addLayer(lddBasin, {min: 0, max:128}, 'selected basin flow directions', false)


