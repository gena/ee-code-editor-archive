/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var colombia = /* color: 00ffff */ee.Geometry.Polygon(
        [[[-77.398681640625, 8.917633696396107],
          [-78.1787109375, 7.122696277518282],
          [-77.71756856524388, 5.953353882362037],
          [-77.728271484375, 4.565473550710278],
          [-77.767515586836, 4.170666351680567],
          [-77.55623159802957, 3.710323858274427],
          [-78.2854408743475, 3.1622509050883827],
          [-78.980712890625, 2.1967272417616712],
          [-79.25535778694461, 1.7574857920286444],
          [-78.94775390625, 1.4280747713669428],
          [-78.585205078125, 1.4500404973608203],
          [-78.3189797429767, 1.8707611403216118],
          [-78.39439925932749, 2.1799535941373307],
          [-78.27823696625711, 2.3456444920907855],
          [-77.78061503081642, 2.4065365658924134],
          [-76.85350228845749, 3.805358442190007],
          [-76.94634091315652, 4.161991352452893],
          [-77.14654174211955, 4.362585159981711],
          [-77.11493485276594, 5.437309100533861],
          [-77.069091796875, 6.904614047238073],
          [-77.52001255635076, 7.297576714616948],
          [-77.17424761084771, 7.854935688335076],
          [-76.82394280142557, 7.611085022905299],
          [-76.46198272611309, 8.010543048235537],
          [-76.44464382493055, 8.514376997508567],
          [-75.849609375, 9.123792057073997],
          [-75.3713350012207, 9.506231903699197],
          [-75.18560667545313, 10.540298908259958],
          [-74.77294921875, 10.800932640687549],
          [-74.35856813241071, 10.777459216151929],
          [-73.9862767476692, 11.04524875224608],
          [-73.2719857723169, 11.059976529299316],
          [-71.93971765822585, 11.878897418981008],
          [-71.64254617322598, 12.077917758440229],
          [-71.4278620502813, 11.639612130408473],
          [-70.872802734375, 11.985591791400083],
          [-71.3397216796875, 12.693932935851421],
          [-71.78459679184698, 12.672683003405254],
          [-72.25932232086137, 12.456965112814437],
          [-72.55071275609396, 12.090196034864551],
          [-73.597412109375, 11.55538032232177],
          [-75.00669076262903, 11.353392768058992],
          [-75.80666813622003, 10.558976186617787],
          [-75.91827745623618, 10.236805951145055],
          [-75.96254370216326, 9.664562435117025],
          [-76.68137843771422, 9.031507067471933],
          [-77.05107265472475, 8.84449819017503]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// CHW -> Colombia Export
// ==============================================
// JFriedman
// 2015-12-09
// ==============================================

// spatial analysis limits
// -----------------------
var aoi = colombia //validation site

// image processing parameters
// ----------------------------
var cld_pct = 75 //for removing useless images
var red_pct = 15 //average percentage for removing clouds/shadows/poor images
var water_thresh = 0 //NDWI cutoff
var min_d = 25 //for removing hill shadow detection [m]

// image visualization settings
// -----------------------------
var imMinBounds = [0.05,0.05,0.05] //RGB min values (most likely keep constant)
var imMaxBounds = [0.5,0.5,0.45] //RGB max values (tweak if too dark/light)

// image export options
// --------------------
var imFlag = true //export images via url
var imScale = 30 //scale for exporting image

// ***************
// ***************

// load image collections (landsat8 and landsat4)
// ----------------------------------------------
var l8 = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
        .filterMetadata('CLOUD_COVER','less_than',cld_pct) //remove really cloudy images
        //.filterDate('2013-01-01','2016-01-01')
        .filterBounds(aoi)
        .select(['B2','B3','B4','B5','B6'],['B','G','R','NIR','SWIR'])
          
var l4 = ee.ImageCollection('LANDSAT/LT4_L1T_TOA')
        .filterMetadata('CLOUD_COVER','less_than',cld_pct) //remove really cloudy images
        .filterDate('1984-01-01','1990-01-01')
        .filterBounds(aoi)
        .select(['B1','B2','B3','B4','B5'],['B','G','R','NIR','SWIR'])

var l5 = ee.ImageCollection('LANDSAT/LT5_L1T_TOA')
        .filterMetadata('CLOUD_COVER','less_than',cld_pct) //remove really cloudy images
        .filterDate('1984-01-01','1990-01-01')
        .filterBounds(aoi)
        .select(['B1','B2','B3','B4','B5'],['B','G','R','NIR','SWIR'])

var l4 = ee.ImageCollection(l5.merge(l4)) //combine historic images together

var l5 = ee.ImageCollection('LANDSAT/LT5_L1T_TOA')
        .filterMetadata('CLOUD_COVER','less_than',cld_pct) //remove really cloudy images
        .filterDate('1990-01-01','2000-01-01')
        .filterBounds(aoi)
        .select(['B1','B2','B3','B4','B5'],['B','G','R','NIR','SWIR'])

var l7 = ee.ImageCollection('LANDSAT/LE7_L1T_TOA')
        .filterMetadata('CLOUD_COVER','less_than',cld_pct) //remove really cloudy images
        .filterDate('2000-01-01','2010-01-01')
        .filterBounds(aoi)
        .select(['B1','B2','B3','B4','B5'],['B','G','R','NIR','SWIR'])

// reduce to percentile image (i.e. average)
// -----------------------------------------
var l4_im = l4.reduce(ee.Reducer.intervalMean(red_pct,red_pct+1)).clip(aoi)
l4_im = l4_im.select(['B_mean','G_mean','R_mean','NIR_mean','SWIR_mean'],['B','G','R','NIR','SWIR'])
var l5_im = l5.reduce(ee.Reducer.intervalMean(red_pct,red_pct+1)).clip(aoi)
l5_im = l5_im.select(['B_mean','G_mean','R_mean','NIR_mean','SWIR_mean'],['B','G','R','NIR','SWIR'])
var l7_im = l7.reduce(ee.Reducer.intervalMean(red_pct,red_pct+1)).clip(aoi)
l7_im = l7_im.select(['B_mean','G_mean','R_mean','NIR_mean','SWIR_mean'],['B','G','R','NIR','SWIR'])
var l8_im = l8.reduce(ee.Reducer.intervalMean(red_pct,red_pct+1)).clip(aoi)
l8_im = l8_im.select(['B_mean','G_mean','R_mean','NIR_mean','SWIR_mean'] ,['B','G','R','NIR','SWIR'])

// determine the NDWI masks
// -------------------------
var l8_ndwi = l8_im.normalizedDifference(['NIR', 'G'])
var l7_ndwi = l7_im.normalizedDifference(['NIR', 'G'])
var l5_ndwi = l5_im.normalizedDifference(['NIR', 'G'])
var l4_ndwi = l4_im.normalizedDifference(['NIR', 'G'])

// // calculate the MASKED NDWI
// var masker = temp_ndwi_l8.gte(water_thresh).subtract(dem.gte(min_d)).subtract(ndvi_l8.gte(0.3))
// var l8_ndwi = masker.where(masker.lte(water_thresh),0)
// var l8_ndwi_masked = l8_ndwi.mask(l8_ndwi)

// var masker = temp_ndwi_l7.gte(water_thresh).subtract(dem.gte(min_d)).subtract(ndvi_l7.gte(0.3))
// var l7_ndwi = masker.where(masker.lte(water_thresh),0)
// var l7_ndwi_masked = l7_ndwi.mask(l7_ndwi)

// var masker = temp_ndwi_l5.gte(water_thresh).subtract(dem.gte(min_d)).subtract(ndvi_l5.gte(0.3))
// var l5_ndwi = masker.where(masker.lte(water_thresh),0)
// var l5_ndwi_masked = l5_ndwi.mask(l5_ndwi)

// var masker = temp_ndwi_l4.gte(water_thresh).subtract(dem.gte(min_d)).subtract(ndvi_l4.gte(0.3))
// var l4_ndwi = masker.where(masker.lte(water_thresh),0)
// var l4_ndwi_masked = l4_ndwi.mask(l4_ndwi)

// visualize masks with opacity
// ----------------------------
Map.addLayer(l8_ndwi.mask(l8_ndwi.gte(water_thresh)),{palette:'FFFF00',opacity:0.5},'NDWI [2010s]',false)
Map.addLayer(l7_ndwi.mask(l7_ndwi.gte(water_thresh)),{palette:'00FFFF',opacity:0.5},'NDWI [2000s]',false)
Map.addLayer(l5_ndwi.mask(l5_ndwi.gte(water_thresh)),{palette:'00FF00',opacity:0.5},'NDWI [1990s]',false)
Map.addLayer(l4_ndwi.mask(l4_ndwi.gte(water_thresh)),{palette:'FF0000',opacity:0.5},'NDWI [1980s]',false)

// visualize the false colour images with coastlines
// -------------------------------------------------
var visParams = {bands:['SWIR','NIR','G'],min:imMinBounds,max:imMaxBounds,gamma:1.5,forceRgbOutput:true}
var l8_flat = l8_im.visualize(visParams)
var l7_flat = l7_im.visualize(visParams)
var l5_flat = l5_im.visualize(visParams)
var l4_flat = l4_im.visualize(visParams)
Map.addLayer(l8_flat,{},'False Colour [2010s]',false)
Map.addLayer(l7_flat,{},'False Colour [2000s]',false)
Map.addLayer(l5_flat,{},'False Colour [1990s]',false)
Map.addLayer(l4_flat,{},'False Colour [1980s]',false)

// visualize the differences between the two NDWI masks (i.e. changes!)
// --------------------------------------------------------------------
var differ = l8_ndwi.gt(water_thresh).subtract(l7_ndwi.gt(water_thresh))
differ = differ.where(differ.gt(0), 1).where(differ.lt(0),-1).mask(differ.neq(0))
var visParams = {palette:['ff0000','ffffff','00ff00'],min:-1,max:1}
var differ_10y = differ//.visualize(visParams)
//Map.addLayer(differ_10y,{},'Morphology (2010s-2000s)',false)

var differ = l8_ndwi.gt(water_thresh).subtract(l5_ndwi.gt(water_thresh))
differ = differ.where(differ.gt(0), 1).where(differ.lt(0),-1).mask(differ.neq(0))
var visParams = {palette:['ff0000','ffffff','00ff00'],min:-1,max:1}
var differ_20y = differ//.visualize(visParams)
//Map.addLayer(differ_20y,{},'Morphology (2010s-1990s)',false)

var differ = l8_ndwi.gt(water_thresh).subtract(l4_ndwi.gt(water_thresh))
differ = differ.where(differ.gt(0), 1).where(differ.lt(0),-1).mask(differ.neq(0))
var visParams = {palette:['ff0000','ffffff','00ff00'],min:-1,max:1}
var differ_30y = differ//.visualize(visParams)
//Map.addLayer(differ_30y,{},'Morphology (2010s-1980s)',false)

//EXPORT MORPHOLOGY
Export.image(differ_10y, 'Morph_2010s-2000s', {
  scale:imScale,
  maxPixels:1e13,
  crs: 'EPSG:4326',
  region:aoi
})

Export.image(differ_20y, 'Morph_2010s-1990s', {
  scale:imScale,
  maxPixels:1e13,
  crs: 'EPSG:4326',
  region:aoi
})

Export.image(differ_30y, 'Morph_2010s-1980s', {
  scale:imScale,
  maxPixels:1e13,
  crs: 'EPSG:4326',
  region:aoi
})

// EXPORT FALSE COLOUR IMAGES
Export.image(l8_flat, 'False_2010s', {
  scale:imScale,
  maxPixels:1e13,
  crs: 'EPSG:4326',
  region:aoi
})

Export.image(l7_flat, 'False_2000s', {
  scale:imScale,
  maxPixels:1e13,
  crs: 'EPSG:4326',
  region:aoi
})

Export.image(l5_flat, 'False_1990s', {
  scale:imScale,
  maxPixels:1e13,
  crs: 'EPSG:4326',
  region:aoi
})

Export.image(l4_flat, 'False_1980s', {
  scale:imScale,
  maxPixels:1e13,
  crs: 'EPSG:4326',
  region:aoi
})

// EXPORT MASKS
Export.image(l8_ndwi.mask(l8_ndwi.gte(water_thresh)), 'Mask_2010s', {
  scale:imScale,
  maxPixels:1e13,
  crs: 'EPSG:4326',
  region:aoi
})

Export.image(l7_ndwi.mask(l7_ndwi.gte(water_thresh)), 'Mask_2000s', {
  scale:imScale,
  maxPixels:1e13,
  crs: 'EPSG:4326',
  region:aoi
})

Export.image(l5_ndwi.mask(l5_ndwi.gte(water_thresh)), 'Mask_1990s', {
  scale:imScale,
  maxPixels:1e13,
  crs: 'EPSG:4326',
  region:aoi
})

Export.image(l4_ndwi.mask(l4_ndwi.gte(water_thresh)), 'Mask_1980s', {
  scale:imScale,
  maxPixels:1e13,
  crs: 'EPSG:4326',
  region:aoi
})

// // DEFINE GRID FOR SMALLER SPATIAL AREAS FOR EXPORTING
// var corner_pts = ee.Geometry(bounds).bounds().coordinates().get(0)
// var LL = ee.List(corner_pts).get(0)
// var UR = ee.List(corner_pts).get(2)
// //print(LL,UR)

// var res = 0.5 //for smoothing the bounds
// var lon_start = ee.Number(ee.List(LL).get(0)).divide(res).floor().multiply(res).getInfo()
// var lon_end = ee.Number(ee.List(UR).get(0)).divide(res).ceil().multiply(res).getInfo()
// var lat_start = ee.Number(ee.List(LL).get(1)).divide(res).floor().multiply(res).getInfo()
// var lat_end = ee.Number(ee.List(UR).get(1)).divide(res).ceil().multiply(res).getInfo()
// //print(lon_start,lon_end,lat_start,lat_end)

// // BUILD SMALLER BOXES FOR OUTPUT
// var polys = [];
// for (var lon = lon_start; lon < lon_end; lon += res) {
//   var x1 = lon - res/2;
//   var x2 = lon + res/2;
//   for (var lat = lat_start; lat < lat_end; lat += res) {
//     var y1 = lat - res/2;
//     var y2 = lat + res/2;
//     polys.push(ee.Geometry.Rectangle(x1, y1, x2, y2));
//   }
// }
// var GRID = ee.FeatureCollection(polys); //add to feature collection together
// //Map.addLayer(GRID,{},'Full Grid',false)

// // REMOVE GRID INSIDE OF CONTINENT
// var FILT_GRID = GRID.map(function(f){
//   var temp = f.geometry().difference(bounds.buffer(-8E5)).intersection(bounds)
//   var num = temp.coordinates().length()
//   return f.set('num', num).set('feats', temp);
// })
// FILT_GRID = FILT_GRID.filter(ee.Filter.gt('num', 0))
// print(FILT_GRID)
// Map.addLayer(FILT_GRID,{},'Search Grid',false)

// //EXPORT IMAGE AS RASTER
// Export.image(differ, 'CHW_Morphology_Mask', {
//   scale:30,
//   maxPixels:1e13,
//   crs: 'EPSG:4326',
//   region:ee.Feature(FILT_GRID.first()).geometry()
//   //region:JSON.stringify(ee.Geometry(bounds).coordinates().getInfo()[0])
// })

