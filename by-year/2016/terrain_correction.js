//Illumination corrections
//Description: Implementation in GEE of an illumination correction algorithm based on the following article:
// Improved forest change detection with terrain illumination corrected Landsat images (2013)
// Bin Tan, Jeffrey G. Masek, Robert Wolfe, Feng Gao, Chengquan Huang, Eric F. Vermote, Joseph O. Sexton, Greg Ederer
// http://www.sciencedirect.com/science/article/pii/S0034425713001673
var image = ee.Image("LC81170572013170LGN00");
var adjusted_image = ee.Image.cat([image.expression("b('B4')+770"),image.select('B3'),image.expression("b('B2')-1230")]);
Map.addLayer(adjusted_image, {bands:'B4, B3, B2', min:7000, max: 10000}, 'Uncorrected single scene');

var clip_polygon = ee.Geometry.Polygon([[[116.682202688, 5.00810290164], [116.682202688, 4.59756309013], [117.094189993, 4.59756309013], [117.094189993, 5.00810290164]]]);
var collection = ee.ImageCollection("LANDSAT/LC8_L1T").filterDate(new Date('6,18,2013'), new Date('6,20,2013')).filterBounds(clip_polygon);
var image2 = collection.median();
//addToMap(image2, {bands:'B4, B3, B2'}, 'Uncorrected composite');

var terrain = ee.call('Terrain', ee.Image('srtm90_v4'));
var solar_zenith = (90-image.getInfo().properties.SUN_ELEVATION);
var solar_azimuth = image.getInfo().properties.SUN_AZIMUTH; 
var solar_zenith_radians = (solar_zenith*Math.PI)/180;
var slope_radians = terrain.select(['slope']).expression("(b('slope')*" + Math.PI + ")/180");
var aspect = terrain.select(['aspect']);

//slope part of the illumination condition
var cosZ = Math.cos(solar_zenith_radians);
var cosS = slope_radians.cos();
var slope_illumination = cosS.expression("b('slope')*(" + cosZ + ")").select(['slope'],['b1']);

//aspect part of the illumination condition
var sinZ = Math.sin(solar_zenith_radians);
var sinS = slope_radians.sin();
var azimuth_diff_radians = aspect.expression("((b('aspect')-" + solar_azimuth + ")*" + Math.PI + ")/180");
var cosPhi = azimuth_diff_radians.cos();
var aspect_illumination = cosPhi.multiply(sinS).expression("b('aspect')*" + sinZ).select(['aspect'],['b1']);

//illumination condition
var ic = slope_illumination.add(aspect_illumination)

//apply the cosine correction
var cos_output = image.expression("((image*cosZ)/ic) + offsets",{
    'image': image.select('B4', 'B3', 'B2'),
    'cosZ': cosZ,
    'ic': ic,
    'offsets': [770, 0, -1230]
  });
//addToMap(cos_output,{bands:'B4,B3,B2', min:7000, max:10000},'Cosine model corrected');  
  
//apply the c model correction
var c_output = image.expression("((image * (cosZ + coeff)) / (ic + coeff)) + offsets", {
    'image': image.select('B4', 'B3', 'B2'),
    'ic': ic,
    'cosZ': cosZ,
    'coeff': [12, 9, 25],
    'offsets': [770, 0, -1230]
  });
Map.addLayer(c_output,{bands:'B4,B3,B2', min:7000, max:10000},'C model corrected');

//apply the tan model correction 
var b4 = image.select('B4').subtract(ic.expression("((b('b1')-" + cosZ + ")*" + 440 + ")-770"));
var b3 = image.select('B3').subtract(ic.expression("(b('b1')-" + cosZ + ")*" + 800));
var b2 = image.select('B2').subtract(ic.expression("((b('b1')-" + cosZ + ")*" + 300 + ")+1230"));
var tan_output = ee.Image.cat([b4,b3,b2]);
//addToMap(tan_output,{bands:'B4,B3,B2', min:7000, max:10000},'Tan model corrected');
Map.setCenter(116.9,4.8, 12);