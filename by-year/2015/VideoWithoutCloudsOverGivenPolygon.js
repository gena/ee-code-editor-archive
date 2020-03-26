/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var aoi = /* color: d63000 */ee.Geometry.Polygon(
        [[[73.06500500292816, 40.753627543286164],
          [73.0666349485117, 40.740103456055834],
          [73.07109817056528, 40.732559272062865],
          [73.07281479429298, 40.740493649248],
          [73.07470308033885, 40.75427900452363],
          [73.07435975548492, 40.761430657143805],
          [73.09083934436751, 40.756099498282836],
          [73.10113908736457, 40.75818000147332],
          [73.10354236080116, 40.747386684242805],
          [73.11143883043803, 40.745305843370666],
          [73.10903555715015, 40.730087715601606],
          [73.10817724526953, 40.723843374080886],
          [73.10895014582275, 40.71779366368629],
          [73.11246880487943, 40.71200353503333],
          [73.12405576429421, 40.711027795262254],
          [73.14010644837936, 40.715907011372494],
          [73.15366762158533, 40.7282665043908],
          [73.14697294371194, 40.73307958829935],
          [73.14628629419144, 40.7368517577517],
          [73.14774552809854, 40.74146884076203],
          [73.14096476034399, 40.7495975064055],
          [73.12637345775136, 40.759090201183234],
          [73.13203831640931, 40.76546124978914],
          [73.14147974752768, 40.769231582719755],
          [73.15195115295671, 40.77079165789814],
          [73.1639675197955, 40.76390104939686],
          [73.169847434448, 40.7579200571057],
          [73.17984615922921, 40.75479914821834],
          [73.1853827544461, 40.7585696320316],
          [73.19366511218709, 40.76351099342911],
          [73.19555339850433, 40.77092166230105],
          [73.19744148831114, 40.77898128668416],
          [73.18147708317144, 40.78678031668848],
          [73.17632721170162, 40.79444830769772],
          [73.1805322474952, 40.800361223024055],
          [73.21254797516576, 40.80991156109558],
          [73.219071147808, 40.811665917223515],
          [73.22010163458526, 40.81887687697071],
          [73.20817112945122, 40.83232165505395],
          [73.18199207077214, 40.830956586615045],
          [73.17031844417272, 40.8256317399468],
          [73.15864598617554, 40.81653756730367],
          [73.15315278980688, 40.8099115614458],
          [73.1473162686691, 40.79860684777361],
          [73.135299901714, 40.791589160467254],
          [73.12603013293801, 40.79015954062344],
          [73.11178215501764, 40.7874301808853],
          [73.10148241195861, 40.784570731307994],
          [73.08225622492148, 40.7817111585517],
          [73.0688665590003, 40.7769015995207],
          [73.06371668749875, 40.775081675559186],
          [73.06380228731655, 40.7724817011003],
          [73.06303003804135, 40.76962160466422],
          [73.05903943008957, 40.766565256114625]]]),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// VideoWithoutCloudsOverGivenPolygon.js

// video on all images, except when there are clouds on water pixels

var LC8_BANDS = ['B1',    'B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10', 'BQA'];
var LC7_BANDS = ['B1',    'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B8', 'B8', 'B7'];
var STD_NAMES = ['blue2', 'blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp', 'BQA'];

var dem = ee.Image('USGS/SRTMGL1_003');
var info = dem.getInfo()
var crs = info.bands[0].crs
var crs_transform = info.bands[0].crs_transform
crs_transform = [crs_transform[0], crs_transform[1], 0.0, crs_transform[3], crs_transform[4], 0.0];

var courierNewFeatures = ee.FeatureCollection('ft:1VAK4EIsvjRr57E-vkhJVLwAp82HAMMktFrGSPB4H').toList(200, 0);
courierNewFeatures = ee.FeatureCollection(courierNewFeatures.getInfo())

//Export.table(ee.FeatureCollection('ft:1VAK4EIsvjRr57E-vkhJVLwAp82HAMMktFrGSPB4H'))

/**
 * Translates and scales polygon geometry.
 */
function movePolygon(poly, x, y, scaleX, scaleY) {
  var coordLists = ee.List(poly.coordinates())

  coordLists = coordLists.map(function(list) {
    return ee.List(list).map(function(o) {
      var pt = ee.List(o)
      return ee.List([
        ee.Number(pt.get(0)).multiply(scaleX).add(x), 
        ee.Number(pt.get(1)).multiply(scaleY).add(y)
      ]);
    })
  })
  
  return ee.Algorithms.GeometryConstructors.Polygon(coordLists);
}

/**
 * Translates and scales MultiPolygon geometry.
 */
function moveTo(geom, x, y, scaleX, scaleY) {
  var geoms = geom.geometries();
  
  geoms = geoms.map(function(g) {
    return movePolygon(ee.Geometry(g), x, y, scaleX, scaleY);
  })
  
  return ee.Feature(ee.Algorithms.GeometryConstructors.MultiPolygon(geoms))
}

/**
 * Converts character to a geospatial feature.
 */
function charToFeature(characters, char) {
  return ee.Feature(characters.filter(ee.Filter.stringContains('char', char)).first());
}

/**
 * Converts text string to a feature collection using position, scale and space between characters.
 */
function textToFeatures(text, x, y, opt_args) {
  var args = opt_args || {};
  var font = args['font'] || 'ProductSans'

  var fonts = {
    'ProductSans' : ee.FeatureCollection('ft:1LwsANQcu6eheWHrqGxZ9fNX5FEjNBTxTEVOClWRw'),
    'Hacker' : ee.FeatureCollection('ft:1GKzZFxab7pSiKdv-s1UpyWHbEHXDwQ4ll37bVZnF'),
    'Helvetica' : ee.FeatureCollection('ft:1ouSXtIXd8syBi6dI2XQYkW5Z7i3bt7sPy2aXEGdS'),
    'HelveticaBold' : ee.FeatureCollection('ft:1JrMdGhJN5O0QPutmzBpC1nebcXY9-N86X0Zb5bLP'),
    'HelveticaBoldItalic' : ee.FeatureCollection('ft:1YKBnGW6txEmb-csXRlWVkeovqzAmaNEppKwpJB9I'),
    'HelveticaItalic' : ee.FeatureCollection('ft:1AnCP7EJcke-hzfVUezweHuwTqSjGWqPpnBrn4PMq'),
    'Consolas' : ee.FeatureCollection('ft:1QseQFRqhtKaYS7z54ohheB_Oy802bL1AcuFyudeK'),
    'CourrierNew' : courierNewFeatures,
  }

  var sizeX = args['sizeX'] || 0.1;
  var sizeY = args['sizeY'] || 0.1;
  var charSpace = args['charSpace'] || 0.1;

  charSpace = ee.Number(charSpace)
  
  var scaleX = sizeX, scaleY = sizeY; // TODO: regenerate fonts so that their size will be known
  
  var chars = ee.String(text).split('');
  var features = ee.List([]);

  var offsetX = ee.Number(x);
  var offsetY = ee.Number(y);

  var charFeatures = ee.List(ee.List(chars).slice(1).iterate(function(char, prev) { 
    return ee.List(prev).add(charToFeature(fonts[font], char)); 
  }, ee.List([])))
  
  var offsetsX = ee.List(charFeatures.iterate(function(f, prev) { 
    var w = ee.Number(ee.Feature(f).get('width')).multiply(scaleX)
    
    var list = ee.List(prev)
    var last = ee.Number(list.get(list.length().subtract(1)))
    
    return list.add(last.add(w).add(charSpace))
  }, ee.List([offsetX]))).slice(0, chars.length())

  var newCharFeatures = charFeatures.zip(offsetsX).map(function(o) {
    var list = ee.List(o)
    var f = ee.Feature(list.get(0))
    var x = list.get(1)
    
    return moveTo(f.geometry(), x, offsetY, scaleX, scaleY);
  })

  return ee.FeatureCollection(newCharFeatures);
}
  
/**
 * Converts text string to an image layer using position, scale and space between characters.
 */
function textToImage(text, x, y, opt_args) {
  var features = textToFeatures(text, x, y, opt_args)

  var args = opt_args || {};
  var filled = typeof args['filled'] == 'undefined' ? true : args['filled'];

  var image = ee.Image(0).toByte();

  if(filled) {
    image = image.paint(features, 1); // paint fill
  }

  image = image.paint(features, 1, 1); // paint outline
  image = image.mask(image);
  
  return image;
}

var sumAll = function (a, start, end) {
    var sum = 0;
    for (var i = start; i < end; i++)
        sum += a[i];
    return sum;
};

function otsu(histogram) {
    var total = sumAll(histogram, 0, histogram.length);
    console.log(total)

    var sum = 0;
    for (var i = 1; i < histogram.length; ++i) {
        sum += i * histogram[i];
    }

    var sumB = 0;
    var wB = 0;
    var wF = 0;
    var mB;
    var mF;
    var max = 0.0;
    var between = 0.0;
    var threshold1 = 0.0;
    var threshold2 = 0.0;

    for (var j = 0; j < histogram.length; ++j) {
        wB += histogram[j];
        if (wB == 0)
            continue;

        wF = total - wB;
        if (wF == 0)
            break;
        sumB += j * histogram[j];
        mB = sumB / wB;
        mF = (sum - sumB) / wF;
        between = wB * wF * Math.pow(mB - mF, 2);
        if ( between >= max ) {
            threshold1 = j;
            if ( between > max ) {
                threshold2 = j;
            }
            max = between;            
        }
    }
    return ( threshold1 + threshold2 ) / 2.0;
}

function getWaterThreshold(waterIndexImage, bounds) {
  var waterEdgeDetectionThreshold = 0.99
  var waterEdgeDetectionSigma = 0.7
  var methodScale = 30
  
  var hist_info = waterIndexImage.reduceRegion({reducer:ee.Reducer.histogram(255), geometry:bounds, scale:methodScale, maxPixels:1e+9}).getInfo()['nd'];
  var hist = hist_info['histogram'] 
  var threshold_index = otsu(hist)

  var threshold = hist_info['bucketMeans'][Math.round(threshold_index)]; 
  //var threshold = Math.max(0, hist_info['bucketMeans'][Math.round(threshold_index)]); 

  print('water threshold: ' + threshold)
  
  return threshold;
}

function getEdge(mask) {
  var canny = ee.Algorithms.CannyEdgeDetector(mask, 0.99, 0);
  return canny.mask(canny)/*.focal_max(0.8)*/
}

function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, azimuth, zenith, weight, height_multiplier) {
  var hsv  = image.unitScale(0, 255).rgbtohsv();

  var terrain = ee.call('Terrain', elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));
  var aspect = radians(terrain.select(['aspect']));
  var hs = hillshade(azimuth, zenith, slope, aspect);

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvtorgb();
}


var slope_threshold = 0.3

function getSlopeMask(dem) {
  var slope = radians(ee.call('Terrain', dem).select(['slope']));
  var slopeMask = slope.gt(slope_threshold)
    //.focal_max({radius:90, units: 'meters'}).focal_min({radius:90, units: 'meters'})
  
  return slopeMask;
}

var demThreshold = 915

function maskHills(demImage) {
  return demImage.lt(demThreshold)
}

Map.centerObject(aoi, 12)
//Map.setCenter(61.4, 41.21)
//Map.setCenter(73.15, 40.76, 12) // Andijan

print('Map scale: ' + Map.getScale())

//aoi = ee.Geometry(Map.getBounds(true))
var bounds = aoi.buffer(1000).bounds()

var demMask = dem.gt(demThreshold)
demMask = demMask.mask(demMask).clip(bounds)


var coords = ee.List(bounds.coordinates().get(0))
var xmin = ee.Number(ee.List(coords.get(0)).get(0))
var xmax = ee.Number(ee.List(coords.get(1)).get(0))
var ymin = ee.Number(ee.List(coords.get(0)).get(1))
var ymax = ee.Number(ee.List(coords.get(2)).get(1))

print(xmin, xmax, ymin, ymax)

//Map.setCenter(50.09, 31.8, 12)
//var bounds = ee.Geometry(Map.getBounds(true))
//var aoi = bounds;

var dem = ee.Image('USGS/SRTMGL1_003'); var dem_name = 'SRTM 30m'
//var dem = ee.Image('srtm90_v4');
//var dem = ee.Image('USGS/NED');
//var dem = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock');
//var dem = ee.Image('WWF/HydroSHEDS/03CONDEM');

var slopeMask = getSlopeMask(dem);

function addDemScaledToBounds(bounds) {
  var azimuth = 90;
  var zenith = 30;
  
  // check if we have 30m here, otherwise switch to 90m
  var demMinMax = dem.reduceRegion(ee.Reducer.minMax(), bounds, 10000).getInfo()
  dem_min = demMinMax['elevation_min']
  if(dem_min === null) {
    //dem = ee.Image('srtm90_v4');
    //dem_name = 'SRTM 90m';
  }
  
  Map.addLayer(dem, {}, 'dem (raw)', false)
  
  var dem_min = 100;
  var dem_max = 800;
  
  // compute min/max dynamically
  var demMinMax = dem.reduceRegion(ee.Reducer.minMax(), bounds, 300).getInfo()
  dem_min = demMinMax['elevation_min']
  dem_max = demMinMax['elevation_max']
  print('dem min: ' + dem_min)
  print('dem max: ' + dem_max)
  var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']
  var v = dem.visualize({palette:colors_dem, min:dem_min, max:dem_max, opacity: 1.0});
  var demRendered = hillshadeit(v, dem, azimuth, zenith, 1.0, 3.0);
  Map.addLayer(demRendered, {}, 'elevation ' + dem_name);

  var s = slopeMask.mask(slopeMask)
  s = s.visualize({opacity:0.7, palette:['000000']})
  Map.addLayer(s, {}, 'slope mask', false)

  return demRendered;
}

var renderedDem = addDemScaledToBounds(bounds)


var images = l8
  .select(LC8_BANDS, STD_NAMES)

//var images = l7
//  .select(LC7_BANDS, STD_NAMES)
//  .filterDate('2013-09-01', '2013-11-01')
  
  .filterBounds(bounds)
  .sort('DATE_ACQUIRED')

// exlude scenes which do not completely cover aoi


// 1. generate HSV-pansharpened image
// 2. compute number of cloudy pixels within polygon
// 3. filter-out images where clouds appear within polygon_clouds
// 4. export video


//var fileName = 'Andijan_video_test_without_clouds_753'
var fileName = 'Andijan_l8_'

var scale = 30

var I_min = 0.05
var I_max = 0.5
var gamma = 1.1


// A helper to apply an expression and linearly rescale the output.
var rescale = function(img, exp, thresholds) {
  return img.expression(exp, {img: img})
      .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
};

// Compute a cloud score.  This expects the input image to have the common
// band names: ["red", "blue", etc], so it can work across sensors.
var cloudScore = function(img) {
  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  
  // Clouds are reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));

  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.3, 0.8]));

  // Clouds are reasonably bright in all infrared bands.
  score = score.min(rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));

  // Clouds are reasonably cool in temperature.
  score = score.min(rescale(img, 'img.temp', [300, 290]));

  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  
  return score.min(rescale(ndsi, 'img', [0.8, 0.6]));
};

var cloudThreshold = 0.65 // lower - more clouds 

var maskClouds = function(img) { 
  return cloudScore(img).gt(cloudThreshold).rename(['cloud'])
};


function snowScore(img){
      // Compute several indicators of snowyness and take the minimum of them.
      var score = ee.Image(1.0)
      
      // Snow is reasonably bright in the blue band.
      score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));
    
      // Snow is reasonably bright in all visible bands.
      score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));
    
      // // Excluded this for snow reasonably bright in all infrared bands.
      score = score.min(rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));
    
      // Snow is reasonably cool in temperature.
      //Changed from [300,290] to [290,275] for AK
      score = score.min(rescale(img, 'img.temp', [300, 285]));
      
      // Snow is high in ndsi.
      var ndsi = img.normalizedDifference(['green', 'swir1']);
      ndsi = rescale(ndsi, 'img', [0.5, 0.7]);
      score = score.min(ndsi);
      
      return score.clamp(0,1).toFloat()
      }

var snowThresh = 0.5; //Lower number masks more out (0-1)

function maskSnow(img){
  return snowScore(img).gt(snowThresh).rename(['snow'])
  //return img.mask(img.mask().and(ss.lt(snowThresh)))
}


//var bad = [61440,59424,57344,56320,53248,52256,52224,49184,49152,45056,28672];
/*
var bad = [61440,59424,57344,56320,53248,52256,52224,49184,49152];

var maskClouds = function(img) {
  return img.select('BQA').eq(bad).reduce('max').rename('cloud'); 
};
*/

var ndwiThreshold = -0.05

function maskWater(i) {
  var ndwi = i.normalizedDifference(['green', 'nir']);
  //var ndwi = i.normalizedDifference(['green', 'swir1']);
  var water = ndwi.gt(ndwiThreshold);
  
  return water;
}

var ndviThreshold = 0.35

function maskVegetation(i) {
  var ndvi = i.normalizedDifference(['nir', 'red']);
  return ndvi.lt(ndviThreshold);
}


var blobMinPixelCount = 150

/*function getPercentileImages(percentiles) {
  return ee.ImageCollection(percentiles.map(function(percentile) {
    var l = ee.List([]);
    l = l.add(percentile)
    
    var bandNames = ee.Image(images.first()).bandNames();

    return images
      .reduce(ee.Reducer.percentile(l))
      .rename(bandNames)
      .clip(bounds)
      .set('percentile', percentile);
  }))
}

var percentiles = ee.List.sequence(5, 55, 5)
var percentileImages = getPercentileImages(percentiles)

var percentileWaterImages = percentileImages.map(function(i) {
  //var ndwi = i.normalizedDifference(['green', 'nir']);
  var ndwi = i.normalizedDifference(['green', 'swir1']);

  var water = ndwi.gt(ndwiThreshold)
  
  return water.mask(water).set('percentile', i.get('percentile'))
})


function showPercentileImageWithWater(p, w, percentile) {
  var pImage = ee.Image(p.filterMetadata('percentile', 'equals', percentile).first())
  var pWater = ee.Image(w.filterMetadata('percentile', 'equals', percentile).first())
  
  Map.addLayer(pImage.select(['swir1', 'nir', 'green']), {min: I_min, max: I_max}, percentile + '%', false)
  Map.addLayer(pWater.mask(pWater), {palette:['0000ff'], opacity:0.7}, percentile + '% (water)', false)
}

showPercentileImageWithWater(percentileImages, percentileWaterImages, 5)
*/      
/*    //Map.addLayer(p.select(['swir1', 'nir', 'green']), {min: I_min, max: I_max}, waterPercentiles[i] + '%', false)
  

    var cannyWater = ee.Algorithms.CannyEdgeDetector(water, 0.99, 0).gt(0.5);
    Map.addLayer(cannyWater.mask(cannyWater), {palette:['0000ff'], opacity:0.9}, waterPercentiles[i] + '% water edge (NDWI=0)', false, false)
    
    var threshold = getWaterThreshold(ndwi, bounds)  
    var water = ndwi.gt(threshold)

    // take only large blobs
    var waterBlobs = water.mask(water).connectedPixelCount(blobMinPixelCount, false);
    var water = waterBlobs.eq(blobMinPixelCount)

    var cannyWater = ee.Algorithms.CannyEdgeDetector(water, 0.99, 0).gt(0.5);
    Map.addLayer(cannyWater.mask(cannyWater), {palette:['a0a0FF'], opacity:0.9}, waterPercentiles[i] + '% water edge', false)

    waterMasks = waterMasks.add(water)
    waterPolygons = waterPolygons.add(water.reduceToVectors({scale: 30, geometry: bounds}))
  }  
}

getWaterFromPercentiles()

//var water_30p = ee.Geometry(ee.FeatureCollection(waterPolygons.get(0)).geometry())
//Map.addLayer(water_30p)

//var water_10p = ee.Image(waterMasks.get(0))
//print(dem.mask(water_10p).reduceRegion(ee.Reducer.histogram(), bounds, 90))
//print(Chart.image.histogram(dem.mask(water_10p), bounds, 90, 100))


//for(var i = 0; i < waterPercentiles.length; i++) {
  //Map.addLayer(ee.Feature(waterPolygons.get(i)), {color:'aaaaff', opacity: 0.7}, 'water poly ' + waterPercentiles[i] )
//}
*/



// pre-computed cloud-free water masks
var cloudfree = ee.FeatureCollection('ft:1TEpTbfTfSfSPOHNj4JG9N5zY7MUjYm7yvGXWK3IV')

var count = 45;

var waterOccurance = ee.ImageCollection(cloudfree.map(function(f) {
  var image = ee.Image(0).toByte();
  image = image.paint(ee.FeatureCollection(f), 1); // paint fill
  return image;
})).sum().divide(count)

Map.addLayer(waterOccurance.mask(waterOccurance.gt(0)), {min:0, max:1, palette:['ffffff', '0000ff']}, 'water occurance')

//Map.addLayer(cloudfree, {color:'0000ff', opacity:0.2}, 'cloudfree')



var collection = images
  .map(function(i){
    // limt to temperature
    i = i.mask(i.select('temp').mask())
    
    //var rgb = i.select('red', 'green', 'blue');
    var rgb = i.select('swir2', 'nir', 'green');
    var image = rgb;

    var snow = maskSnow(i);
    var clouds = maskClouds(i).and(snow.not());
    var vegetation = maskVegetation(i);
    var hills = maskHills(dem)
    var slopes = slopeMask.not()

    var sceneEdge = getEdge(i.select('red').mask().not())
      //.focal_max({radius:30, units: 'meters'})
    var sceneEdgeVis = sceneEdge.visualize({palette:['FFFF00'], opacity:0.9, forceRgbOutput: true});

    var water = maskWater(i)
      .mask(vegetation.or(hills).or(slopes).or(clouds).or(snow))

    water = water.mask(water)
    //water = water.mask(water.mask(waterOccurance.gt(0).focal_max({radius:90, units:'meters'})))
      .connectedPixelCount(blobMinPixelCount, false)
      .eq(blobMinPixelCount)
      .reproject(crs, crs_transform)
      
      .clip(bounds)
      
    water = water.updateMask(water)      

    // var waterVis = water.mask(water).visualize({palette:['ffffff'], opacity:0.3, forceRgbOutput: true});
    // show water as original image, RGB, stretched
    var waterVis = i.select(['red', 'green', 'blue']).mask(water).visualize({gamma:gamma, min:0.05, max:0.25});

    //var waterVis = water.mask(water).visualize({palette:['000000', 'ffffff'], min:0, max:50, forceRgbOutput: true});


    //return waterVis
    //  .set('date', i.get('DATE_ACQUIRED'))
    //  .clip(bounds)
    //  .addBands(water.rename('water'))

    var waterEdge = getEdge(water)

    var waterEdgeVis = waterEdge
      .visualize({palette:['a0a0FF'], opacity:0.9, forceRgbOutput: true})

    var nearEdge = i.select('red').mask().not().focal_min({radius:90, units:'meters'})
    var waterLandEdge = waterEdge.mask()
      .and(sceneEdge.mask().focal_max({radius:90, units:'meters'}).not()) // not near scene edge
      .and(clouds.focal_max({radius:150, units:'meters'}).not()) // not near/within clouds
      
    var v = waterLandEdge
    //var v = getEdge(waterLandEdge.focal_max({radius:30, units:'meters'})) // get edge around
    //var v = waterLandEdge.focal_max({radius:60, units:'meters'})
    var waterLandEdgeVis = v.mask(v).focal_max(1)
      .visualize({palette:['30FF30'], opacity:0.7, forceRgbOutput: true})
      
    var snowEdge = getEdge(snow);

    // number of snow pixels overlapping with water
    var snowWaterPixelCount = ee.Dictionary(snow.focal_max({radius:60, units:'meters'}).and(water)
      .reduceRegion({reducer: ee.Reducer.sum(), geometry: aoi, scale: 30, maxPixels:1e9})).get('snow')

    // number of cloud pixels overlapping with water
    var cloudWaterPixelCount = ee.Dictionary(clouds.focal_max({radius:60, units:'meters'}).and(water)
      .reduceRegion({reducer: ee.Reducer.sum(), geometry: aoi, scale: 30, maxPixels:1e9})).get('cloud')

    var snowVis = snow.mask(snow).visualize({palette:['00FFFF'], opacity:0.6, forceRgbOutput: true});
    var snowEdgeVis = snowEdge.visualize({palette:['00FFFF'], opacity:0.9, forceRgbOutput: true});
    
    var cloudsVis = clouds.mask(clouds.multiply(cloudScore(i)))
      .visualize({palette: ['FFFFFF', 'FF0000'], opacity:0.5})

    var cloudsEdgeVis = getEdge(clouds)
        .visualize({palette: ['FF0000'], opacity:0.8})

    var vegetationEdgeVis = getEdge(vegetation)
        .visualize({palette: ['00FF00'], opacity:0.8})

    var hillsEdgeVis = getEdge(hills)
        .visualize({palette: ['000000'], opacity:0.8})
        
    // compute scalars
    var waterAtSceneEdge = waterEdge.and(sceneEdge).reduceRegion(ee.Reducer.sum(), bounds, 30).get('nd')
      
    var waterArea = ee.Number(water.reduceRegion(ee.Reducer.sum(), bounds, 30).get('nd')).multiply(30*30)

    var x = xmin.add(xmax.subtract(xmin).multiply(0.05))
    var y = ymin.add(ymax.subtract(ymin).multiply(0.1))

    var text = ee.String(i.get('DATE_ACQUIRED')).cat(' ').cat(i.get('LANDSAT_SCENE_ID'))
    
    //var text = waterArea.toString()
    
    var textImage = textToImage(text, x, y,
            {sizeX:0.0006, sizeY:0.0004, charSpace:0.001, font:'CourrierNew'})
      .visualize({palette:['000000']})

    image = ee.ImageCollection.fromImages([
      image.visualize({gamma:gamma, min:I_min, max:I_max}), // show pan-sharpened image
      //vegetationEdgeVis,
      //hillsEdgeVis,
      //snowVis,
      //snowEdgeVis,
      cloudsVis,
      cloudsEdgeVis,
      sceneEdgeVis,
      waterVis,
      waterEdgeVis,
      waterLandEdgeVis,
      //textImage
    ]).mosaic()

    return image
      .set('id', i.get('LANDSAT_SCENE_ID'))
      .set('date', i.get('DATE_ACQUIRED'))
      .set('cloud_pixels', cloudWaterPixelCount)
      .set('snow_pixels', snowWaterPixelCount)
      .set('water_area', waterArea)
      .set('water_at_edge', waterAtSceneEdge)
      .clip(bounds)
      .addBands(water.rename('water'))
      .addBands(i.select('red').mask().eq(1).rename('mask'))
  });

//var max_cloud_pixel_count = -1
var max_cloud_pixel_count = 50

// filter images with clouds over area
print('All:', collection.aggregate_count('date')); 
 
//collection = collection.filterMetadata('intersects_with_geom', 'equals', false);
//print('Without goem intersects:', collection.aggregate_count('intersects_with_geom'));

if(max_cloud_pixel_count >= 0) {
  //collection = collection.filterMetadata('cloud_pixels', 'less_than', max_cloud_pixel_count);
  //print('Without clouds:', collection.aggregate_count('cloud_pixels'));
}

collection = collection
  //.filterMetadata('water_at_edge', 'greater_than', 20)
  //.filterMetadata('water_at_edge', 'less_than', 30)
  .filterMetadata('cloud_pixels', 'less_than', 20) // cloud pixels at water edge
  //.filterMetadata('water_area', 'greater_than', 100000)
  //.sort('water_area')

//  .filterMetadata('date', 'equals', '2015-05-06') // thin clouds
//  .filterMetadata('date', 'equals', '2015-06-23')
//  .filterMetadata('date', 'equals', '2013-07-19')


//collection = collection
//  .filterMetadata('cloud_pixels', 'greater_than', 10)
//  .filterMetadata('snow_pixels', 'less_than', 10)
//print('With clouds:', collection.aggregate_count('cloud_pixels'));

//collection = collection.filterMetadata('snow_pixels', 'greater_than', 10)
//print('With snow:', collection.aggregate_count('cloud_pixels')); 

// select only images where water intersets with the edge
//collection = collection.filterMetadata('water_at_edge', 'greater_than', 0)

// select only with clouds
//collection = collection.filterMetadata('cloud_pixels', 'greater_than', 10);

print('Filered:', collection.aggregate_count('date')); 

//var results = collection.select('water').sum().divide(collection.select('mask').sum())
//Map.addLayer(results, {min:0, max:1, palette:['ffffff', '0000ff']}, 'results (corrected)')

//var results = collection.select('water').sum().divide(ee.Number(collection.aggregate_count('date')))
//Map.addLayer(results, {min:0, max:1, palette:['ffffff', '0000ff']}, 'results')

var waterPolygons = collection.map(function(i){
  var g = ee.FeatureCollection(i.select('water')
        .reduceToVectors({scale: 30, geometry: bounds})
          //.filter(ee.Filter.gt('count', 300))
          )
        .geometry();
        
  var waterPolygon = ee.Feature(g)
    .set('id', i.get('id'))
    .set('date', i.get('date'))
    .set('water_area_geom', g.area(1))
    .set('water_area', i.get('water_area'))
    .set('water_at_edge', i.get('water_at_edge'))
    .set('cloud_pixels', i.get('cloud_pixels'))

  return waterPolygon;
})

Export.table(waterPolygons, 'cloud_free_water_polygons')

var maskPolygons = collection.map(function(i){
  var g = ee.FeatureCollection(i.select('mask')
        .reduceToVectors({scale: 30, geometry: bounds})
          //.filter(ee.Filter.gt('count', 300))
          )
        .geometry();

  var mask = ee.Feature(g)
    .set('id', i.get('id'))
    .set('date', i.get('date'))
    .set('water_area_geom', g.area(1))
    .set('water_area', i.get('water_area'))
    .set('water_at_edge', i.get('water_at_edge'))
    .set('cloud_pixels', i.get('cloud_pixels'))

  return mask;
})

Export.table(maskPolygons, 'cloud_free_mask_polygons')

//Export.table(ee.FeatureCollection(demMask.reduceToVectors({scale: 30, geometry: bounds})), 'demMask')

var f0 = ee.Feature(ee.List(waterPolygons.toList(1,0)).get(0))
Map.addLayer(f0, {color:'0000ff'}, 'f0', false)
print(f0)

print(f0.getInfo())

Export.table(ee.FeatureCollection(f0), 'fff', {fileFormat:'KML'})

var f1 = ee.Feature(ee.List(waterPolygons.toList(1,1)).get(0))
Map.addLayer(f1, {color:'0000ff'}, 'f1', false)

var f2 = ee.Feature(ee.List(waterPolygons.toList(1,2)).get(0))
Map.addLayer(f2, {color:'0000ff'}, 'f2', false)

Map.addLayer(ee.Feature(cloudfree.filter(ee.Filter.eq('water_area', 51072300)).first()))

function computeIntersection() {
  // for every cloud-free polygon compute intersection with the given watermask
  var intersections = cloudfree.map(function(f) {
    var g1 = f.geometry()
    var g2 = f2.geometry()
    var intersection = g1.intersection(g2).area(1)
    return f.set('intersection', intersection);
  }) 
  
  var l = intersections.toList(10, 0)
  for(var i = 0; i < 10; i++) {
    print(i, ee.Feature(l.get(i)).get('intersection'))
  }
  
  for(var i = 0; i < 10; i++) {
    Map.addLayer(ee.Feature(l.get(i)), {}, i.toString())
    print(i)
    print(l.get(i))
  }
}

//computeIntersection();


//var f1Image = ee.Image(collection.first()).select('water')
//Map.addLayer(f1Image.mask(f1Image), {color:'0000ff'}, 'f1 image')

//var f1_1 = ee.Feature(ee.FeatureCollection(f1Image.eq(1).reduceToVectors({scale: 30, geometry: bounds})).geometry())
//Map.addLayer(f1_1, {color:'0000ff'}, 'f1_1')


var count = 6;
var start = 0
var list = collection.toList(count, start);

for(var i=0; i < count - 1; i++) {
  var image = ee.Image(list.get(i)).clip(bounds)
  Map.addLayer(image.clip(bounds), {}, i.toString() + ' - ' + image.get('id').getInfo(), i === 0);
  print(image)
}  

//var bounds = Map.getBounds();
//var region = '[['+bounds[0]+', '+bounds[1]+'], ['+bounds[2]+', '+bounds[1]+'], ['+bounds[2]+', '+bounds[3]+'], ['+bounds[0]+', ' + bounds[3] + ']]';

var coords = ee.List(bounds.bounds(1, ee.Projection('EPSG:3857')).coordinates().get(0)).getInfo()
var w = Math.round((coords[1][0] - coords[0][0])/scale)
var h = Math.round((coords[2][1] - coords[1][1])/scale)
print(w + 'x' + h)

// export video without clouds
Export.video(collection.select([0,1,2]), fileName, {
  dimensions: w + 'x' + h,
  framesPerSecond: 5,
  region: JSON.stringify(bounds.getInfo()) //region
});
  

Map.addLayer(demMask, {opacity:0.7, palette:['000000']}, 'dem > ' + demThreshold, false);
