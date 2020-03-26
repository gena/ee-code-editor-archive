var modis_myd = ee.ImageCollection("MODIS/MYD09GA"),
    modis_mod = ee.ImageCollection("MODIS/MOD09GA"),
    mod_gq = ee.ImageCollection("MODIS/MOD09GQ"),
    myd_gq = ee.ImageCollection("MODIS/MYD09GQ"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");

var BAND_NAMES_MODIS = ['sur_refl_b07', 'sur_refl_b02', 'sur_refl_b04', 'sur_refl_b01', 'sur_refl_b03']
var BAND_NAMES_L7 = ['B7', 'B4', 'B2', 'B3', 'B1']
var BAND_NAMES_L8 = ['B6', 'B5', 'B3', 'B4', 'B2']
var BAND_NAMES_STD = ['swir', 'nir', 'green', 'red', 'blue']

var start = '2001-01-01'
var end = '2001-02-01'

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
  return ee.Feature(characters.filterMetadata('ascii', 'equals', char.charCodeAt(0)).first());
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
    'CourrierNew' : ee.FeatureCollection('ft:1VAK4EIsvjRr57E-vkhJVLwAp82HAMMktFrGSPB4H'),
  }

  var sizeX = args['sizeX'] || 0.1;
  var sizeY = args['sizeY'] || 0.1;
  var charSpace = args['charSpace'] || 0.1;

  charSpace = ee.Number(charSpace)
  
  var scaleX = sizeX, scaleY = sizeY; // TODO: regenerate fonts so that their size will be known
  
  var chars = text.split('');
  var features = ee.List([]);
  var offsetX = ee.Number(x);
  var offsetY = ee.Number(y);

  for(var i = 0; i < chars.length; i++) {
    var f = charToFeature(fonts[font], chars[i]);

    var g = moveTo(f.geometry(), offsetX, offsetY, scaleX, scaleY);
    features = features.add(ee.Feature(g))
    
    var w = ee.Number(f.get('width')).multiply(scaleX)
    offsetX = offsetX.add(w).add(charSpace);
  }
  
  return ee.FeatureCollection(features);
}

/**
 * Converts character to a geospatial feature.
 */
function charToFeatureParallel(characters, char) {
  return ee.Feature(characters.filter(ee.Filter.stringContains('char', char)).first());
}

/**
 * Converts text string to a feature collection using position, scale and space between characters.
 */
function textToFeaturesParallel(text, x, y, opt_args) {
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
    'CourrierNew' : ee.FeatureCollection('ft:1VAK4EIsvjRr57E-vkhJVLwAp82HAMMktFrGSPB4H'),
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
    return ee.List(prev).add(charToFeatureParallel(fonts[font], char)); 
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
  //var features = textToFeatures(text, x, y, opt_args)
  var features = textToFeaturesParallel(text, x, y, opt_args)

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

function renderModis(img) {
  return img
    .select(BAND_NAMES_MODIS, BAND_NAMES_STD)
    .visualize({min: 200, max: 4000})
    .set('system:time_start', img.get('system:time_start'))
    .set('system:time_end', img.get('system:time_end'))
}

function renderLandsat7(img) {
  var result = img
    .select(BAND_NAMES_L7, BAND_NAMES_STD)
    .visualize({min: 0.05, max: 0.5})

    var edge = ee.Image(0).toByte().paint(img.geometry(), 1, 1)
    edge = edge.mask(edge).visualize({palette:'ffff00', forceRgbOutput: true})
  
    return ee.ImageCollection.fromImages([result, edge]).mosaic()
      .set('system:time_start', img.get('system:time_start'))
      .set('system:time_end', img.get('system:time_end'))
}

function renderLandsat8(img) {
  return img
    .select(BAND_NAMES_L8, BAND_NAMES_STD)
    .visualize({min: 0.05, max: 0.5})
    .set('system:time_start', img.get('system:time_start'))
    .set('system:time_end', img.get('system:time_end'))
}

var bounds = Map.getBounds(true)

var average = modis_mod
    .filterBounds(bounds)
    .filterDate('2014-05-01', '2015-10-01')
    .select(BAND_NAMES_MODIS, BAND_NAMES_STD).select(['red', 'green', 'blue'])
    .reduce(ee.Reducer.percentile([15]))
    .visualize({min: 200, max: 3000})

var modis = modis_mod // new ee.ImageCollection(modis_mod.merge(modis_myd))
    .filterBounds(bounds)
    .filterDate(start, end)
    .sort('system:time_start')
    .map(renderModis)
    
l7 = l7
    .filterBounds(bounds)
    .filterDate(start, end)
    .sort('system:time_start')
    .map(renderLandsat7)
    
function renderMosaic(ic, start, end) {
  return ic.filterDate(start, end).mosaic()
}

// Map.addLayer(renderMosaic(l7, ee.Date('2001-01-01').format('YYYY-MM-dd'), ee.Date('2001-02-01').format('YYYY-MM-dd')))

var b = Map.getBounds();
var x = b[0]+0.1;
var y = b[1]+0.1;

function renderText(text, x, y) {
  return textToImage(ee.String(text), ee.Number(x), ee.Number(y), 
    {sizeX:0.05, sizeY:0.05, charSpace:0.1, font:'CourrierNew', filled:true})
    .visualize({palette:['ffffff'], opacity:0.7});
}

function renderAll(start, end) {
  return ee.ImageCollection.fromImages([
      average,
      //ee.Image(modis.filterDate(start, end).first()),
      renderMosaic(l7, start, end),
      renderText(ee.Date(start).format('MMM DD, YYYY'), x, y)
    ]).mosaic();
}

// Map.addLayer(renderAll(ee.Date('2001-01-01').format('YYYY-MM-dd'), ee.Date('2001-02-01').format('YYYY-MM-dd')))

var dateStart = ee.Date('2001-01-01')
var dateEnd = ee.Date('2002-01-01')
//var dateEnd = ee.Date('2016-04-01')

var timeStep = 1;
var timeStepUnit = 'month'

/*
var timeStep = 1;
var timeStepUnit = 'day'
*/

var timeStepCount = dateEnd.difference(dateStart, timeStepUnit).getInfo();

var dates = ee.List.sequence(0, timeStepCount)
  .map(function(t) {
    return dateStart.advance(t, timeStepUnit)
  })

print(dates)

var videoFrames = ee.ImageCollection(dates.map(function(d) { 
  var start = ee.Date(d);
  var end = start.advance(timeStep, timeStepUnit)

  return renderAll(start.format('YYYY-MM-dd'), end.format('YYYY-MM-dd'))
}));

var list = videoFrames.toList(10, 0)

for(var i = 0; i < 10; i++) {
  Map.addLayer(ee.Image(list.get(i)), {}, i.toString(), i === 0)
}

// ================================= export video
var scale = 1000;
var bounds = Map.getBounds();
var region = '[['+bounds[0]+', '+bounds[1]+'], ['+bounds[2]+', '+bounds[1]+'], ['+bounds[2]+', '+bounds[3]+'], ['+bounds[0]+', ' + bounds[3] + ']]';
var geom = ee.Geometry(Map.getBounds(true))
var coords = ee.List(geom.bounds(1, ee.Projection('EPSG:3857')).coordinates().get(0)).getInfo()
var w = Math.round((coords[1][0] - coords[0][0])/scale)
var h = Math.round((coords[2][1] - coords[1][1])/scale)
print(w + 'x' + h)

Export.video(videoFrames, 'MODIS_LANDSAT_MOSAIC_MEKONG', {
  dimensions: w + 'x' + h,
  framesPerSecond: 2,
  region: region});

