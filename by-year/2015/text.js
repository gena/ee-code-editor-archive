/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// text.js

/*
Author: Gennadii Donchyts
License: Apache License, Version 2.0, http://www.apache.org/licenses/LICENSE-2.0 

Known issues:
* for some fonts the letter 'o' is converted with small changes, not really an ellipse
* size is specified in empirical units, characters need to be scaled to e.g. 1x1 degree

*/

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

// show current date
var image = textToImage(Date().toString(), 8, 0,
  {sizeX:0.2, sizeY:0.2, charSpace:0.5, font:'Hacker', filled:false});

Map.addLayer(image, {palette:['ffffff']}, 'date (text)')

// show welcome messate
var image = textToImage('Hello Google Earth Engine!', 8, 10,
  {sizeX:0.7, sizeY:0.7, charSpace:1.4, font:'ProductSans', filled:true});

Map.addLayer(image.focal_max(2), {palette:['000000'], opacity:0.7}, 'hello (text)')

// test different fonts
var rect = ee.Geometry.Rectangle([[-5, -13],[120, -5]], 'EPSG:4326', false)
Map.addLayer(rect, {color:'ffffff'}, 'rectangle')


Map.addLayer(textToImage('Product Sans', -3, -10, 
  {sizeX:0.3, sizeY:0.3, charSpace:0.6, font:'ProductSans', filled:true}), 
  {palette:['000000'], opacity:0.7}, 'Font: Product Sans')

Map.addLayer(textToImage('Consolas', 20, -10,
  {sizeX:0.3, sizeY:0.3, charSpace:0.6, font:'Consolas', filled:true}), 
  {palette:['000000'], opacity:0.7}, 'Font: Consolas')

Map.addLayer(textToImage('Hacker', 37, -10, 
  {sizeX:0.3, sizeY:0.3, charSpace:0.6, font:'Hacker', filled:true}), 
  {palette:['000000'], opacity:0.7}, 'Font: Hacker')

Map.addLayer(textToImage('Helvetica', 55, -10, 
  {sizeX:0.3, sizeY:0.3, charSpace:0.6, font:'Helvetica', filled:true}), 
  {palette:['000000'], opacity:0.7}, 'Font: Helvetica')

Map.addLayer(textToImage('Helvetica Bold', 70, -10,
  {sizeX:0.3, sizeY:0.3, charSpace:0.6, font:'HelveticaBold', filled:true}), 
  {palette:['000000'], opacity:0.7}, 'Font: Helvetica Bold')

Map.addLayer(textToImage('Courrier New', 96, -10,
  {sizeX:0.3, sizeY:0.3, charSpace:0.6, font:'CourrierNew', filled:true}), 
  {palette:['000000'], opacity:0.7}, 'Font: Courrier New')

// zoom out and switch to satellite map
Map.setCenter(54.64, 3.10, 4)
print(Map.getCenter())
Map.setStyle('SATELLITE')

