/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var g = /* color: d63000 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.LineString(
                [[-126.27685546875, 44.19795903948531],
                 [-124.1455078125, 44.621754096233246],
                 [-123.81591796875, 44.66865287227321],
                 [-122.62939453125, 44.150681159780916],
                 [-122.3876953125, 43.56447158721811],
                 [-122.93701171875, 42.73087427928485]]),
            {
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.LineString(
                [[-118.6083984375, 42.09822241118974],
                 [-118.6962890625, 43.03677585761058],
                 [-118.19091796875, 43.37311218382002],
                 [-116.91650390625, 43.75522505306928],
                 [-115.11474609375, 43.48481212891604],
                 [-114.36767578125, 44.24519901522129]]),
            {
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.LineString(
                [[-122.76123046875, 38.87392853923629],
                 [-122.27783203125, 39.436192999314095],
                 [-121.640625, 39.554883059924016],
                 [-120.52001953125, 39.639537564366705],
                 [-120.21240234375, 40.010787140465524],
                 [-120.05859375, 40.463666324587685]]),
            {
              "system:index": "2"
            }),
        ee.Feature(
            ee.Geometry.LineString(
                [[-127.46337890625, 40.730608477796636],
                 [-126.27685546875, 41.294317263152585],
                 [-124.60693359375, 41.178653972331695],
                 [-123.15673828125, 41.22824901518531],
                 [-121.61865234375, 41.590796851056005],
                 [-120.47607421875, 41.590796851056005]]),
            {
              "system:index": "3"
            }),
        ee.Feature(
            ee.Geometry.LineString(
                [[-116.3232421875, 40.49709237269567],
                 [-113.44482421875, 39.095962936305504],
                 [-110.28076171875, 40.48038142908172],
                 [-111.07177734375, 41.96765920367816],
                 [-113.994140625, 42.21224516288584],
                 [-116.4111328125, 42.17968819665961]]),
            {
              "system:index": "4"
            }),
        ee.Feature(
            ee.Geometry.LineString(
                [[-120.2783203125, 43.16512263158295],
                 [-119.794921875, 42.19596877629178],
                 [-119.24560546875, 41.88592102814745],
                 [-117.92724609375, 41.40977583200956],
                 [-117.24609375, 40.27952566881291],
                 [-117.509765625, 38.32442042700652]]),
            {
              "system:index": "5"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function makeOrthogonalLine(points, length) {
  var pt1 = ee.List(ee.List(points).get(0))
  var pt2 = ee.List(ee.List(points).get(1))
  
  var x1 = ee.Number(pt1.get(0))
  var y1 = ee.Number(pt1.get(1))
  var x2 = ee.Number(pt2.get(0))
  var y2 = ee.Number(pt2.get(1))
  
  // c - hypothenuse, wx, wy - lengths of adjacent and opposite legs
  var wx = x1.subtract(x2).abs()
  var wy = y1.subtract(y2).abs()
  var c = wx.multiply(wx).add(wy.multiply(wy)).sqrt()
  
  var sin = x2.subtract(x1).divide(c)
  var cos = y2.subtract(y1).divide(c)
  
  var pt = ee.List(points.get(0))
  var ptx = ee.Number(pt.get(0))
  var pty = ee.Number(pt.get(1))
  
  var pt1x = ptx.subtract(cos.multiply(length).multiply(0.5));
  var pt1y = pty.add(sin.multiply(length).multiply(0.5));
  var pt2x = ptx.add(cos.multiply(length).multiply(0.5));
  var pt2y = pty.subtract(sin.multiply(length).multiply(0.5));
  
  return ee.Algorithms.GeometryConstructors.LineString(ee.List([pt1x, pt1y, pt2x, pt2y]))
}

function bufferButtCap(lineFeature, bufferSize) {
  bufferSize = ee.Number(bufferSize)
  var geom = ee.Feature(lineFeature).geometry();
  var buffer = geom.buffer(bufferSize);
  var coords = geom.coordinates()

  var lineLength = ee.Number(bufferSize).divide(ee.Projection('EPSG:4326').nominalScale()).multiply(3)

  var begin = makeOrthogonalLine(coords, lineLength)
  var end = makeOrthogonalLine(coords.slice(-2).reverse(), lineLength)
 
  var bufferSizeLine = bufferSize.multiply(0.01)
  var split = buffer.difference(begin.buffer(bufferSizeLine)).difference(end.buffer(bufferSizeLine))

  return ee.FeatureCollection(split.geometries()
        .map(function(o) {
          return ee.Feature(ee.Geometry(o), {'length': geom.intersection(o).length()})
        })).sort('length', false).first();
}


var useOsm = false;

if(useOsm) {
  // OpenStreetMap geometry
  var fc = ee.FeatureCollection('ft:17iPU6E9a7L5e4QTC-0fJodgCJC3jqIejztSiYANE').limit(300)
  var bufferSize = 10
  var zoom = 16
} else {
  // test geometry
  var fc = g;
  var bufferSize = 10000
  var zoom = 7
}


var buffers = fc.map(function(f) { return f.buffer(bufferSize); });
var bufferButtCaps = fc.map(function(f) { return bufferButtCap(f, bufferSize); });

Map.centerObject(fc, zoom)

Map.addLayer(buffers, {}, 'default caps', true)
Map.addLayer(bufferButtCaps, {color:'00ff00', opacity: 0.5}, 'poor man\'s butt caps', true)
Map.addLayer(fc, {color:'ffffff'}, 'fc', true)
