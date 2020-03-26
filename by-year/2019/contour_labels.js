/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var DEM = ee.Image("USGS/SRTMGL1_003");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var palettes = require('users/gena/packages:palettes')
var geometry = require('users/gena/packages:geometry')
var text = require('users/gena/packages:text')
var gl = require('users/gena/packages:gl')

var min = 500;
var max = 3000;
var step = 300;

DEM = DEM.resample('bicubic')

// styled terrain
var hillshade = ee.Terrain.hillshade(DEM);
var DEM_normalized = DEM.subtract(min).divide(max-min);

var DEM_styled = DEM.visualize({ min: min, max: max, palette: palettes.cb.BrBG[11] }).unitScale(0, 255)
var terrain = DEM_styled.rgbToHsv().addBands(hillshade.divide(256).rename('value'), ['value'], true).hsvToRgb()

terrain = terrain.visualize();
Map.addLayer(terrain, {}, 'DEM', true, 0.5);

// contours
var contours = DEM
  .convolve(ee.Kernel.gaussian(5, 3))
  .clamp(min, max)
  .subtract(min)
  .divide(step)
  .add(0.5)
  .floor()
  .int()


// Map.addLayer(contours, { min: 0, max: (max - min) / step })

var bounds = Map.getBounds(true)
var scale = Map.getScale()

// minimum number of cells per contour (contour length)
var minCount = 10000

// number of labels per contour
var pointCount = 10

// get contour line strings
var contoursFeatures = contours.reduceToVectors({ geometry: bounds, scale: scale })
contoursFeatures = contoursFeatures.filter(ee.Filter.gt('count', minCount)).map(function(f) {
  var geom = ee.Geometry.LineString(f.geometry().coordinates().get(0))
  
  var label = ee.Number.parse(f.get('label')).multiply(step).format('%.0f')
  return ee.Feature(geom).set({ label: label })
})

Map.addLayer(contoursFeatures.style({width: 1, color: '000000' }), { }, 'contours')

var points = contoursFeatures.map(function(f) {
  var l = f.length(scale)
  
  var distances = ee.List.sequence(0, l, l.divide(pointCount))
  
  var segments = f.geometry().cutLines(distances).geometries().map(function(g) {
    g = ee.Geometry(g)
    
    return ee.Feature(g).set({ vertexCount: g.coordinates().size() })
  })
  
  segments = ee.FeatureCollection(segments)
    .filter(ee.Filter.gt('vertexCount', 6))
  
  var points = segments.map(function(s) { 
    var coords = s.geometry().coordinates()
    var pt0 = ee.List(coords.get(0))
    var pt = ee.Geometry.Point(coords.get(3))
    var pt1 = ee.List(coords.get(6))
    var theta = geometry.angle(pt0, pt1)

    return ee.Feature(pt, {
      theta: theta,
      label: f.get('label') 
    })
  })
  
  return ee.FeatureCollection(points)
}).flatten()

points = ee.FeatureCollection(points)

// ... SLOW AS HELL!
// EE server-side API is not yet suitable for this

var labels = points.map(function(f) {
  var str = text.draw(f.get('label'), f.geometry(), scale, { 
    fontSize: 18, textColor: '000000', fontType: 'Arial',
    outlineColor: 'ffffff', outlineWidth: 4, outlineOpacity: 0.75
  })
  
  var theta = ee.Number(f.get('theta')).add(Math.PI / 2)
  
  var pt = f.geometry()
  
  return gl.rotateImage(str, pt, theta)
})

labels = ee.ImageCollection(labels)

Map.addLayer(labels)
