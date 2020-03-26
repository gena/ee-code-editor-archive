var dem = ee.Image("NOAA/NGDC/ETOPO1").select('bedrock')
var rect = ee.Geometry.Rectangle([-180, -89, 180, 89], 'EPSG:4326', false)
var dem = dem.visualize({min:-1000, max:5000, forceRgbOutput:true}).clip(rect)
var countries = ee.Image().paint(ee.FeatureCollection('ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw'), 1, 1).visualize({palette:['ffffff']}).clip(rect)

/***
 * Default map projection used in most online maps, not for world maps in publications / figures, pixels are terribly distorted 
 */
function showWebMercator() {
  Map.addLayer(dem, {}, 'dem (Web Mercator)', false)
  Map.addLayer(countries, {}, 'countries (Web Mercator)', false)
}

/***
 * One of popular map projections, a compromise between equal area and conformal (http://brilliantmaps.com/xkcd/)
 * 
 * http://spatialreference.org/ref/esri/54030/
 */
function showRobinson() {
  var proj = ee.Projection('PROJCS["World_Robinson",'
  + 'GEOGCS["gcs",DATUM["d",SPHEROID["s",6378137,298.257223563]],'
  + 'PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Robinson"],UNIT["Meter",1]]').scale(0.9, 0.9)
  
  // dem
  var image = dem.changeProj(proj, ee.Projection('EPSG:3857'))
  Map.addLayer(image, {}, 'dem (Robinson)')
  
  // countries - >> FAILS <<
  var image = countries.changeProj(proj, ee.Projection('EPSG:3857'))
  Map.addLayer(image, {}, 'countries (Robinson)')
}

/***
 * Winkel Triple (used by National Geographics maps) 
 * 
 * http://spatialreference.org/ref/sr-org/7291/  
 */
function showWinkelTriple() {
  // default WKT from http://spatialreference.org/ref/sr-org/7291 - >>FAILS<< (can't parse)
  var proj = ee.Projection('PROJCS["World_Winkel_Tripel_NGS",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],'
    + 'PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Winkel_Tripel"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],'
    + 'PARAMETER["Central_Meridian",15.0],PARAMETER["Standard_Parallel_1",40.0],UNIT["Meter",1.0]]')

  // dem
  var image = dem.changeProj(proj, ee.Projection('EPSG:4326'))
  Map.addLayer(image, {}, 'dem (Winkel Tripple)')
  
  // countries
  var image = countries.changeProj(proj, ee.Projection('EPSG:4326'))
  Map.addLayer(image, {}, 'countries (Winkel Tripple)')
}

Map.addLayer(ee.Image(1), {palette:['ffffff']}, 'background', true, 0.5)
Map.setCenter(0,0,2)

showWebMercator()
showRobinson()
//showWinkelTriple()

