// ============================================================= TEXT

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

// ============================================================= SCRIPT HELPERS
function renderLandsat8(img) {
  return img
    .select(['B6', 'B5', 'B3'])
    .visualize({min: 0.05, max: 0.5})
    .set('system:time_start', img.get('system:time_start'))
    .set('system:time_end', img.get('system:time_end'))
}

function renderText(text, x, y, w, h) {
  return textToImage(ee.String(text), ee.Number(x), ee.Number(y), 
    {sizeX:w, sizeY: h, charSpace: w * 2, font:'CourrierNew', filled:true})
    .visualize({palette:['ffffff'], opacity:0.7});
}
// export video
function exportVideo(frames, scale, rect, taskName) {
  var geom = rect
  var coords = ee.List(geom.bounds(1, ee.Projection('EPSG:3857')).coordinates().get(0)).getInfo()
  var w = Math.round((coords[1][0] - coords[0][0])/scale)
  var h = Math.round((coords[2][1] - coords[1][1])/scale)
  print(w + 'x' + h)
  
  Export.video(frames, taskName, {
    dimensions: w + 'x' + h,
    framesPerSecond: 2,
    region: Map.getBounds(true)});
}

// ============================================================= MAIN SCRIPT CODE
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");

var start = ee.Date('2013-01-01')
var stop = ee.Date('2014-01-01')

var aoi = ee.Geometry(Map.getBounds(true))

// text dimensions, 10% from left-bottom
var bounds = aoi.bounds().coordinates().getInfo()[0];

var textW = ee.Number(bounds[0][0] - bounds[1][0]).abs().divide(100);
var textH = textW;

var textX = ee.Number(bounds[0][0]).add(textW);
var textY = ee.Number(bounds[0][1]).add(textH);

// render function for a single video frame
function render(image) {
  var text = image.get('CLOUD_COVER');
  
  return ee.ImageCollection.fromImages([
      image,
      renderText(text, textX, textY, textW, textH)
    ]).mosaic();
}

// render 
var videoFrames = l8
  .filterDate(start, stop)
  .map(render);

// export
var scale = 1000;
exportVideo(videoFrames, scale, aoi, 'Landsat8 and SRTM with text');

// add a few frames as map layers
var count = 5
var list = videoFrames.toList(count, 0)

for(var i = 0; i < count; i++) {
  Map.addLayer(ee.Image(list.get(i)), {}, i.toString(), i === 0)
}

