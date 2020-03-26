/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var south_america = /* color: 009999 */ee.Geometry.Polygon(
        [[[-76.44041539910916, 10.96000956682035],
          [-78.74929549483954, 7.240559107261705],
          [-79.01591670743483, 3.86609617797058],
          [-82.27125566665967, -0.588751643031941],
          [-82.45305444952498, -7.010119587507411],
          [-79.84065299953141, -10.752332706708595],
          [-78.76652639700114, -14.309645933050444],
          [-73.26756933860509, -18.871800813070926],
          [-72.30131376930683, -20.649260874416285],
          [-72.7939882961013, -26.565622408894114],
          [-75.57586205386724, -37.642471917056724],
          [-77.48876928351967, -51.33832026234473],
          [-75.0925853052766, -55.0820447187681],
          [-70.09112569000564, -56.74358675485184],
          [-62.416403262469544, -55.59168276972409],
          [-63.44944954003819, -54.01813540909244],
          [-66.20614298627316, -51.91847520678301],
          [-63.36890565131637, -45.351462388751564],
          [-61.00223853324053, -40.082267540730825],
          [-57.941165494308166, -39.11782107796548],
          [-56.078039234690436, -37.870572080806646],
          [-55.672817943718655, -35.70778636340298],
          [-52.66415786874529, -34.89289013292337],
          [-46.47517486431684, -27.626139701792937],
          [-46.382065456057546, -25.990677510421843],
          [-44.89966776315572, -25.13958997041193],
          [-41.336580185930984, -24.337971100052314],
          [-38.05474908399168, -20.38147890301149],
          [-37.430883752658815, -15.749413735344657],
          [-36.416298213907794, -12.973114322473263],
          [-33.09181013169723, -8.228563751967693],
          [-33.22200218028195, -5.125331003949127],
          [-37.356406345545224, -1.9626252931120602],
          [-43.027833994399316, -0.8348635234340532],
          [-47.616937721309, 1.155956538027483],
          [-48.978696550135055, 3.944670694146863],
          [-51.094337319805334, 6.463381946210135],
          [-56.17652626341197, 8.341544086471107],
          [-62.274519093946196, 11.622059098457843],
          [-66.69852281303565, 12.391312980933046],
          [-71.84892689372339, 13.425683425642376],
          [-74.7095326527708, 12.577139297225818]]]),
    colombia = /* color: ff00ff */ee.Geometry.Polygon(
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
// REQUIRED INPUTS

//var bounds = Map.getBounds(true) //more efficient for debugging
var bounds = colombia //validation site
//var bounds = south_america //entire continent analysis

// LOAD OPENSTREETMAPS COASTLINE
var dist = 7500 //buffer distance [m]
var accuracy = 100 //buffer accuracy [m]
var OSM = ee.FeatureCollection('ft:1MP_HIatHwTTRltyAPrHz785VCE_XNQJ2bfvOzFx8')
                  .filterBounds(bounds)
                  .map(function(ft) {
                    return ft.geometry()
                    .intersection(ee.Geometry(bounds),ee.ErrorMargin(1))
                    .simplify(accuracy).buffer(dist,accuracy)
                  }).union()
Map.addLayer(ee.Image().byte().paint(OSM,0,2),{palette:'000000',opacity:0.5},'OSM Coastline',false)

var cld_pct = 75 //remove images with high cloud coverage
var red_pct = 20 //percentile reduction value
var ndwi_cutoff = 0 //simple ndwi threshold for water-land interface

// LOAD IMAGE COLLECTIONS
var l8 = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
        .filterMetadata('CLOUD_COVER','less_than',cld_pct)
        .filterBounds(bounds)
        .select(['B2','B3','B4','B5','B6','B8'],['B','G','R','NIR','SWIR','P'])
        .map(function(image) {
          var rgb = image.select(['SWIR','NIR','G']);
          var pan = image.select('P').unitScale(0, 1);
          var hsv  = rgb.rgbtohsv();
          var intensity = pan.add(hsv.select('value'));
          var huesat = hsv.select('hue', 'saturation');
          var copy = ee.Image.cat(huesat, intensity).hsvtorgb().select(['red','green','blue'],['SWIR','NIR','G'])
          return image.addBands(copy,['SWIR','NIR','G'],true)})

var l5 = ee.ImageCollection('LANDSAT/LT5_L1T_TOA')
        .filterMetadata('CLOUD_COVER','less_than',cld_pct)
        .filterDate('1984-01-01','1990-01-01')
        .filterBounds(bounds)
        .select(['B1','B2','B3','B4','B5'],['B','G','R','NIR','SWIR'])

var l4 = ee.ImageCollection('LANDSAT/LT4_L1T_TOA')
        .filterMetadata('CLOUD_COVER','less_than',cld_pct)
        .filterDate('1984-01-01','1990-01-01')
        .filterBounds(bounds)
        .select(['B1','B2','B3','B4','B5'],['B','G','R','NIR','SWIR'])

l4 = ee.ImageCollection(l4.merge(l5))

// // SHOW THE COUNT OF THE IMAGES FOR EACH COLLECTION
// Map.addLayer(l8.select('B').count().clip(bounds),{min:0,max:100},'Present count',true);
// Map.addLayer(l4.select('B').count().clip(bounds),{min:0,max:100},'Historic count',true);

// print(l4.size())
// print(l8.size())

// //EXPORT IMAGE AS RASTER
// var url = l4.select('B').count().clip(bounds).getDownloadURL({
//   name:'Historic', scale:75, crs: 'EPSG:4326',region:JSON.stringify(ee.Geometry(bounds).coordinates().getInfo()[0])})
// print(url);
// var url = l8.select('B').count().clip(bounds).getDownloadURL({
//   name:'Present', scale:75, crs: 'EPSG:4326',region:JSON.stringify(ee.Geometry(bounds).coordinates().getInfo()[0])})
// print(url);

// REDUCE TO PERCENTILE IMAGE
var l4_im = l4.reduce(ee.Reducer.intervalMean(red_pct,red_pct+1)).clip(OSM)
var l8_im = l8.reduce(ee.Reducer.intervalMean(red_pct,red_pct+1)).clip(OSM)

// VISUALIZE THE FALSE COLOR IMAGES
var visParams = {bands:['SWIR_mean','NIR_mean','G_mean'],min:0,max:0.4,gamma:1.5}
Map.addLayer(l8_im,visParams,'Present',false)
Map.addLayer(l4_im,visParams,'Historic',false)

// VISUALIZE THE NDWI MASKS
var l8_ndwi = l8_im.normalizedDifference(['NIR_mean','G_mean'])
var l4_ndwi = l4_im.normalizedDifference(['NIR_mean','G_mean'])

// Map.addLayer(l8_ndwi.mask(l8_ndwi.gt(ndwi_cutoff)),{palette:'FFFF00',opacity:0.5},'NDWI: Present',false)
// Map.addLayer(l4_ndwi.mask(l4_ndwi.gt(ndwi_cutoff)),{palette:'FF00FF',opacity:0.5},'NDWI: Historic',false)

// VISUALIZE THE COASTLINE DIFFERENCES
var differ = l8_ndwi.gt(ndwi_cutoff).subtract(l4_ndwi.gt(ndwi_cutoff))
differ = differ.where(differ.gt(0), 1).where(differ.lt(0),-1).mask(differ.neq(0))
var visParams = {palette:['ff0000','ffffff','00ff00'],min:-1,max:1}
Map.addLayer(differ,{palette:['ff0000','ffffff','00ff00'],min:-1,max:1},'Longterm Morphology',true)

// DEFINE GRID FOR SMALLER SPATIAL AREAS FOR EXPORTING
var corner_pts = ee.Geometry(bounds).bounds().coordinates().get(0)
var LL = ee.List(corner_pts).get(0)
var UR = ee.List(corner_pts).get(2)
//print(LL,UR)

var res = 0.5 //for smoothing the bounds
var lon_start = ee.Number(ee.List(LL).get(0)).divide(res).floor().multiply(res).getInfo()
var lon_end = ee.Number(ee.List(UR).get(0)).divide(res).ceil().multiply(res).getInfo()
var lat_start = ee.Number(ee.List(LL).get(1)).divide(res).floor().multiply(res).getInfo()
var lat_end = ee.Number(ee.List(UR).get(1)).divide(res).ceil().multiply(res).getInfo()
//print(lon_start,lon_end,lat_start,lat_end)

// BUILD SMALLER BOXES FOR OUTPUT
var polys = [];
for (var lon = lon_start; lon < lon_end; lon += res) {
  var x1 = lon - res/2;
  var x2 = lon + res/2;
  for (var lat = lat_start; lat < lat_end; lat += res) {
    var y1 = lat - res/2;
    var y2 = lat + res/2;
    polys.push(ee.Geometry.Rectangle(x1, y1, x2, y2));
  }
}
var GRID = ee.FeatureCollection(polys); //add to feature collection together
//Map.addLayer(GRID,{},'Full Grid',false)

// REMOVE GRID INSIDE OF CONTINENT
var FILT_GRID = GRID.map(function(f){
  var temp = f.geometry().difference(bounds.buffer(-8E5)).intersection(bounds)
  var num = temp.coordinates().length()
  return f.set('num', num).set('feats', temp);
})
FILT_GRID = FILT_GRID.filter(ee.Filter.gt('num', 0))
print(FILT_GRID)
Map.addLayer(FILT_GRID,{},'Search Grid',false)

//EXPORT IMAGE AS RASTER
Export.image(differ, 'CHW_Morphology_Mask', {
  scale:30,
  maxPixels:1e13,
  crs: 'EPSG:4326',
  region:ee.Feature(FILT_GRID.first()).geometry()
  //region:JSON.stringify(ee.Geometry(bounds).coordinates().getInfo()[0])
})

