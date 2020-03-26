/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var proba = ee.ImageCollection("VITO/PROBAV/S1_TOC_100M");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Load the two images to be registered.
var image1 = ee.Image('SKYSAT/GEN-A/PUBLIC/ORTHO/MULTISPECTRAL/s01_20150502T082736Z');
var image2 = ee.Image('SKYSAT/GEN-A/PUBLIC/ORTHO/MULTISPECTRAL/s01_20150305T081019Z');

// Use bicubic resampling during registration.
var image1Orig = image1.resample('bicubic');
var image2Orig = image2.resample('bicubic');

// Choose to register using only the 'R' band.
var image1RedBand = image1Orig.select('R');
var image2RedBand = image2Orig.select('R');

// Determine the displacement by matching only the 'R' bands.
var displacement = image2RedBand.displacement({
  referenceImage: image1RedBand,
  maxOffset: 50.0,
  patchWidth: 100.0
});

// Compute image offset and direction.
var offset = displacement.select('dx').hypot(displacement.select('dy'));
var angle = displacement.select('dx').atan2(displacement.select('dy'));

// Display offset distance and angle.
Map.addLayer(offset, {min:0, max: 20}, 'offset');
Map.addLayer(angle, {min: -Math.PI, max: Math.PI}, 'angle');
Map.setCenter(37.44,0.58, 15);
    
// Use the computed displacement to register all original bands.
var registered = image2Orig.displace(displacement);

// Show the results of co-registering the images.
var visParams = {bands: ['R', 'G', 'B'], max: 4000};
Map.addLayer(image1Orig, visParams, 'Reference');
Map.addLayer(image2Orig, visParams, 'Before Registration');
Map.addLayer(registered, visParams, 'After Registration');

var alsoRegistered = image2Orig.register({
  referenceImage: image1Orig,
  maxOffset: 50.0,
  patchWidth: 100.0
});
Map.addLayer(alsoRegistered, visParams, 'Also Registered');
