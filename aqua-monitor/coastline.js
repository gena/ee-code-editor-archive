/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var coastline = ee.FeatureCollection("ft:1MP_HIatHwTTRltyAPrHz785VCE_XNQJ2bfvOzFx8");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Based on OpenStreetmap Level 6 data
// See: http://wiki.openstreetmap.org/wiki/Coastline

// We look at a resolution of 1 km
var resolution = 1000
// Everything near 40km of the coast is coast
var bufferSize = 40000

// Splitup the coast into 500km sections (for performance)
var maxSegmentLength = 500000

// lookup long sections (continents and big islands with coastlines longer >36000 km)
var lengths = ee.List.sequence(maxSegmentLength, 36000000, maxSegmentLength)

// We don't need details, simplify the coastlines
coastline = coastline.map(function(f){ return f.set('length', f.length()).simplify(resolution)})

// seperate the long from the short and cut the long in pieces
var coastlineLong = coastline.filter(ee.Filter.gt('length', maxSegmentLength)).map(function(f) {
  return ee.FeatureCollection(
      f.cutLines(lengths).geometry().geometries().map(function(g) { 
        return ee.Feature(ee.Geometry(g)) 
      })
  )}).flatten()
  
var coastlineShort = coastline.filter(ee.Filter.lte('length', maxSegmentLength))  

// combine  
var all = ee.FeatureCollection([coastlineLong, coastlineShort]).flatten()

// for debugging
Map.addLayer(coastlineLong, {}, 'long', false)
Map.addLayer(coastlineShort, {color:'eea0a0'}, 'short', false)

// buffer
var allBuffered = all.map(function(f) { return f.buffer(bufferSize, ee.ErrorMargin(bufferSize/5)) })

// rasterize the buffer
var buffer = ee.Image().toByte().paint(allBuffered, 1)

// show it
Map.addLayer(buffer.mask(buffer), {opacity:0.6}, 'buffer vector', true)

// export in this area
var bounds = ee.Geometry.Rectangle([-180, -80, 180, 90], 'EPSG:4326', false)
Map.addLayer(bounds, {}, 'world', false)

// and export to drive
Export.image.toDrive(
  {
    image: buffer,
    description: 'coastline_buffer_' + bufferSize,
    fileNamePrefix: 'coastline_buffer_' + bufferSize,
    region: bounds, 
    scale: resolution,
    maxPixels: 1e12
  })

