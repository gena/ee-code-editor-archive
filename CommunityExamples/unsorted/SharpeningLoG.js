Map.setCenter(32.84, 39.94, 13)

var sentinel2 = ee.ImageCollection('COPERNICUS/S2')
  .filterBounds(ee.Geometry(Map.getBounds(true)).centroid(1));

var image = ee.Image(sentinel2
  .sort('CLOUDY_PIXEL_PERCENTAGE', true)
  .toList(1, 0).get(0))
  .resample('bicubic')
  
print(image)
print(ee.Date(image.get('system:time_start')))
  
var bands = ['B4', 'B3', 'B2', 'QA60'];

var vis = {bands:['B4','B3','B2'], min:600, max:[3000, 3000, 3800], gamma: 1.2}
Map.addLayer(image, vis, 'image', false);

// sharpen see e.g. http://www.cse.psu.edu/~rtc12/CSE486/lecture11_6pp.pdf
var log = image
  .convolve(ee.Kernel.gaussian(10, 7, 'meters')) // G
  .convolve(ee.Kernel.laplacian8(0.4)) // L of G
  
var sharpened = image.subtract(log)
Map.addLayer(sharpened, vis, 'image (sharpened)', true);



