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

  image = image.paint(features, 2, 1); // paint outline
  image = image.mask(image.gt(0));
  
  return image;
}

// ============================================================= SCRIPT HELPERS
function renderText(text, x, y, w, h, color) {
  return textToImage(ee.String(text), ee.Number(x), ee.Number(y), 
    {sizeX: w, sizeY: h, charSpace: w.multiply(3), font:'HelveticaBold', filled:true})
    .visualize({palette:['000000', 'ffffff'], min:1, max:2})
}

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
//Map.setCenter(4.51, 51.96, 10)


//var images = ee.ImageCollection("COPERNICUS/S2").select(['B11', 'B8', 'B3']);
//var images = ee.ImageCollection("COPERNICUS/S2").select(['B8', 'B4', 'B3']);
var images = ee.ImageCollection("COPERNICUS/S2").select(['B4', 'B8', 'B2']);
//var images = ee.ImageCollection("COPERNICUS/S2").select(['B8', 'B2', 'B3']);
var min = 1200
var max = [2600,2600,3200]
var textProperty = "PRODUCT_URI"

//var images = ee.ImageCollection("LANDSAT/LC8_L1T_TOA").select(['B8', 'B5', 'B3']);
//var min = 0.05
//var max = 0.5
//var textProperty = "DATE_ACQUIRED"

var start = ee.Date('2015-01-01')
var stop = ee.Date('2016-01-01')

var aoi = ee.Geometry(Map.getBounds(true))

var scale = 150;

// compute text dimensions
var bounds = aoi.bounds().coordinates().getInfo()[0];
var textW = ee.Number(bounds[0][0] - bounds[1][0]).abs().divide(250);
var textH = textW.divide(1.5);
var textX = ee.Number(bounds[0][0]).add(textW.multiply(3));
var textY = ee.Number(bounds[0][1]).add(textW.multiply(3));

var bg = ee.Image(1).visualize({palette:['ffffff']});

// render a single video frame
function renderFrame(image) {
  var text = image.get(textProperty)

  var edge = ee.Image(0).toByte().paint(image.select(0).geometry(), 1, 2)
  edge = edge.mask(edge).visualize({palette:['ff0000']})
  
  return ee.ImageCollection.fromImages([
      bg,
      image.visualize({min: min, max: max}),
      edge,
      renderText(text, textX, textY, textW, textH)
    ]).mosaic().clip(aoi);
}

// render 
var videoFrames = images
  .filterDate(start, stop)
  .filterBounds(aoi.centroid(1))
  .map(renderFrame);

// export
exportVideo(videoFrames, scale, aoi, 'Landsat8 and SRTM with text');

// add a few frames as map layers
var count = 10
var list = videoFrames.toList(count, 0)

for(var i = 0; i < count; i++) {
  Map.addLayer(ee.Image(list.get(i)), {}, i.toString(), i === 0)
}
