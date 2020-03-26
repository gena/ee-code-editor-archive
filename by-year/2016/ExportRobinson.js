/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var image = ee.Image("NOAA/NGDC/ETOPO1");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var dem = image.select('bedrock')

// export in Robinson - FAILS
var rect = ee.Geometry.Rectangle([-180, -90, 180, 90])
Export.image.toDrive({image: i, description: 'dem_Robinson', fileNamePrefix: 'dem_Robinson', dimensions: '1024x768', region: rect, crs: 'EPSG:53030'})

// show as Web Mercator
var i = dem.visualize({min:-1000, max:5000, forceRgbOutput:true})
Map.addLayer(i, {}, 'dem (Web Mercator)')

// show as WGS84
var j = i.changeProj(ee.Projection('EPSG:4326'), ee.Projection('EPSG:3857').scale(111315, 111315))
Map.addLayer(ee.ImageCollection([ee.Image(0).visualize({palette:['ffffff']}), j]).mosaic(), {}, 'dem (WGS84)')

Map.setCenter(0,0,1)

