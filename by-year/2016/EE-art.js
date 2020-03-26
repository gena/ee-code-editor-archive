/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var LowerLeftCorner = /* color: d63000 */ee.Geometry.Point([77.795565625, 15.378207890744385]),
    UpperRightCorner = /* color: 98ff00 */ee.Geometry.Point([124.44354785156247, 36.47213338666785]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/*
This script demonstrates how to export an image to Google Drive for the Earth Engine
User Summit Art Contest.

INSTRUCTIONS:
  1. Modify the code at the bottom that creates an image object (ee_art_image)
     and visualization parameters (ee_art_viz_params).
  2. Using the geometry tools, adjust the points that define the lower-left
     and upper-right corners of the rectangle that will be exported.
  3. Run the script to preview what will be exported.
  4. When you are happy with the preview, click on the Tasks tab and run the task.
  5. When the export task finishs, download the image from drive and preview the image.
  6. Once you are happy with the exported image, click the "Get Link" button to update
     the URL for the page. Copy and paste the new URL into the 
     "Earth Engine Code Editor Script URL" box on the contest submission form.
     The form is available at: https://goo.gl/vr02LW
  
Hints:
  * You should not need to modify the "create_task_for_exporting_ee_art" function,
    just the code after the REPLACE THE FOLLOWING WITH YOUR OWN CODE comment.
  * If you don't want distortion, use a rectangle with an aspect ratio of 16:9. If you
    do want distortion, knock yourself out.
    
*/

// fix w/h ratio to keep it 16:9 by increasing height
var w = ee.Number(LowerLeftCorner.coordinates().get(0)).subtract(UpperRightCorner.coordinates().get(0)).abs()
var h = ee.Number(LowerLeftCorner.coordinates().get(1)).subtract(UpperRightCorner.coordinates().get(1)).abs()
var hx = w.divide(16/9)
UpperRightCorner = ee.Geometry.Point([UpperRightCorner.coordinates().get(0), ee.Number(LowerLeftCorner.coordinates().get(1)).add(hx)])

// This function exports an image for that can be submitted to the EE Art competition.
function create_task_for_exporting_ee_art(
  artwork_name, image, viz_params, LLCorner, URCorner) {

    var image_for_export = image.visualize(viz_params);
    Map.addLayer(image, viz_params, 'Export Image');
    // Display the region that will be exported.
    var region = ee.Geometry.Rectangle({
      coords:ee.List([LLCorner, URCorner]),
      geodesic:false
    });
    // Paint all the polygon edges with the same number and width, display.
    var outline = ee.Image().byte().paint({
      featureCollection: region,
      color: 1,
      width: 3
    });
    
    Map.addLayer(outline, {palette:'FF0000'}, 'Export Region');
    Map.centerObject(region);
    Export.image.toDrive({
      image: image_for_export,
      description: artwork_name.split(' ').join('_'), 
      dimensions: "1920x1080", // a 16:9 aspect ratio image
      region: region
    });
}

/////////////////////////////////////////////////////////////////////////
// REPLACE THE FOLLOWING WITH YOUR OWN CODE
/////////////////////////////////////////////////////////////////////////

// desaturate image
function desaturate(rgb, scale) {
  var hsv = rgb.rgbToHsv();
  var hue = hsv.select('hue');
  var sat = hsv.select('saturation');
  var val = hsv.select('value');
  sat = sat.multiply(scale);
  var desaturated = ee.Image.cat(hue, sat, val).hsvToRgb();

  return desaturated;
}

// render image
function renderImage() {
  var scale = ee.Image("users/gena/AquaMonitor/water_changes_1985_240_2013_48");
  var land300m = ee.Image("users/gena/AquaMonitor/water_changes_1985_240_2013_48_land_300m");
  var water300m = ee.Image("users/gena/AquaMonitor/water_changes_1985_240_2013_48_water_300m");
  var ne = ee.Image("users/gena/NE1_HR_LC_SR_W");

  var naturalEarthDesaturated = desaturate(ne.unitScale(0, 255), 0.1);
  
  var bg = ee.Image(1).visualize({opacity :0.9, forceRgbOutput: true})
  
  var maxArea = 400

  var landVis = land300m.mask(land300m.divide(maxArea))
    .visualize({min: 0, max: maxArea, palette: ['000000', '00ff00']})

  var waterVis = water300m.mask(water300m.divide(maxArea))
    .visualize({min: 0, max: maxArea, palette: ['000000', '00d8ff']})

  // heatmap
  var bufferSize = 20000
  var blurSize = 20000
  var blurSigma = 15000
  var maxArea = 750000

  var heatmapWater = water300m
    .reduceResolution(ee.Reducer.sum(), true, 100)
    .reproject(water300m.projection().scale(10, 10))
    .multiply(2500)
    .focal_max(bufferSize, 'circle', 'meters')
    .convolve(ee.Kernel.gaussian(blurSize, blurSigma, 'meters'));
  
  var heatmapLand = land300m
    .reduceResolution(ee.Reducer.sum(), true, 100)
    .reproject(land300m.projection().scale(10, 10))
    .multiply(2500)
    .focal_max(bufferSize, 'circle', 'meters')
    .convolve(ee.Kernel.gaussian(blurSize, blurSigma, 'meters'));

  var heatmapColors = ['000000', '00d8ff', 'aaffff']
  var heatmapWaterVis = heatmapWater.mask(heatmapWater.divide(maxArea))
    .visualize({min:0, max:maxArea, opacity: 0.2, palette: heatmapColors})
  
  var heatmapColors = ['000000', '00ff00', 'aaffaa']
  var heatmapLandVis = heatmapLand.mask(heatmapLand.divide(maxArea))
    .visualize({min:0, max:maxArea, opacity: 0.2, palette: heatmapColors})

  // composite
  var image = ee.ImageCollection.fromImages([
    naturalEarthDesaturated.visualize({gamma:0.2}).rename(['r','g','b']),
    bg.visualize({opacity:0.7}).rename(['r','g','b']),
    waterVis.rename(['r','g','b']),
    landVis.rename(['r','g','b']),
    heatmapLandVis.rename(['r','g','b']),
    heatmapWaterVis.rename(['r','g','b'])
  ]).mosaic().visualize({forceRgbOutput:true})

/*
  Map.addLayer(naturalEarthDesaturated.visualize({gamma:0.3}).rename(['r','g','b']))
  Map.addLayer(bg, {opacity:0.7}, 'bg')
  Map.addLayer(landVis, {}, 'land (300m)', true)
  Map.addLayer(waterVis, {}, 'water (300m)', true)
  Map.addLayer(heatmapWaterVis, {}, 'heatmap (water)', true);
  Map.addLayer(heatmapLandVis, {}, 'heatmap (land)', true);
*/    
  return image.clip(ee.Geometry.Rectangle([LowerLeftCorner, UpperRightCorner], 'EPSG:4326', false))
}  

var ee_art_image = renderImage()

var ee_art_viz_params = {};
Map.addLayer(ee_art_image, ee_art_viz_params, 'image', false);

print(ee_art_image.getDownloadURL({format:'png', dimensions:'1920x1080'}))

create_task_for_exporting_ee_art(
  'Desert Fingers',  // the Artwork Title
  ee_art_image,      // the image object to export
  ee_art_viz_params, // the visualization parameters applied before exporting
  LowerLeftCorner,   // adjust this using the map geometry tools
  UpperRightCorner   // adjust this using the map geometry tools
);



/*
Trendy Water 

My work explores the relationship between surface water generated by natural and man-made processes, such as climate changes happening on Tibetan Plateau, migration of Ganges-Brahmaputra River, land reclamation along the Chinese coasts, and uncountable number of new reservoirs constructed during the last last 30 years in the East Asia. 

With influences as diverse as Claude Monet and Vincent van Gogh, new tensions are crafted from both orderly and random textures. What starts out as hope soon becomes debased into a tragedy of distress, leaving only a sense of decadence and the possibility of a new synthesis. 

*/