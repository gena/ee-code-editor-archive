Map.setCenter(146.98, -36.09, 15)

var water = ee.Image("users/gena/MNDWI_15_water_WGS")

water = water.expression('r+g+b', {r:water.select(0), g:water.select(1), b:water.select(2)}).gt(0)

Map.addLayer(water.mask(water), {palette:['5050ff']}, 'water (before smoothing)', false)

function smoothImage(image, opt_multiplier) {
  var multiplier = typeof opt_multiplier !== 'undefined' ? opt_multiplier : 0.7;
  
  var kernelSize = multiplier * 30 / Map.getScale();

  image = image
    .focal_max(multiplier * kernelSize)
    .focal_mode(kernelSize, 'circle', 'pixels', 5)
    .focal_min(multiplier * kernelSize);

  return image.mask(image);
}

Map.addLayer(smoothImage(water, 1.2), {palette:['5050ff'], opacity: 0.8}, 'water 1.2', false)
Map.addLayer(smoothImage(water, 1.0), {palette:['5050ff'], opacity: 0.8}, 'water 1.0', false)
Map.addLayer(smoothImage(water, 0.8), {palette:['1010ff'], opacity: 0.8}, 'water 0.8', true)
Map.addLayer(smoothImage(water, 0.5), {palette:['1010ff'], opacity: 0.8}, 'water 0.5', false)

