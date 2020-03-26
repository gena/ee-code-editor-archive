/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var image = ee.Image("users/gena/NL_Schiermonnikoog_elevation-from-mean-mndwi-landsat_1986-2015"),
    ahn = ee.Image("AHN/AHN2_05M_RUW"),
    geometry = /* color: d63000 */ee.Geometry.Polygon(
        [[[5.946178436279297, 53.46567165925015],
          [5.95433235168457, 53.464598642743894],
          [5.958452224731445, 53.462810221627535],
          [5.957937240600586, 53.46183933289881],
          [5.951757431030273, 53.460817320776655],
          [5.945234298706055, 53.45969307902698],
          [5.944461822509766, 53.45575799847186],
          [5.958366394042969, 53.45442918761393],
          [5.966434478759766, 53.454326969671854],
          [5.971584320068359, 53.46025520362288],
          [5.972785949707031, 53.46383218577665],
          [5.967893600463867, 53.469810183141774],
          [5.946865081787109, 53.47149613275022],
          [5.92411994934082, 53.47159830936193],
          [5.920085906982422, 53.46832853577401],
          [5.925664901733398, 53.46618260995843],
          [5.932102203369141, 53.467051212047934],
          [5.939655303955078, 53.46694902448936]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
image = image.resample('bicubic')
Map.addLayer(image, {min: -0.5, max: 4}, 'Z (-0.5 .. 4)', false)
Map.addLayer(ahn, {min: -0.5, max: 4}, 'AHN (-0.5 .. 4)', false)

var diff = image.subtract(ahn).clamp(-5, 5)
Map.addLayer(diff, {min: -2, max: 2, palette:['ff0000','00ff00', '0000ff']}, 'diff (+/- 0.5')

// var bounds = ee.Geometry(Map.getBounds(true))
var bounds = geometry

print(Chart.image.histogram(diff, bounds, 1, 100))

// Map.centerObject(image, 12)
print(Map.getCenter())