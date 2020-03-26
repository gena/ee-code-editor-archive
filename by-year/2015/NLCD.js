/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var nlcd = ee.ImageCollection("USGS/NLCD");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var colorsRainbow = [
'F26C4F', // Light Red
'F68E55', // Light Red Orange	
'FBAF5C', // Light Yellow Orange
'FFF467', // Light Yellow
'ACD372', // Light Pea Green
'7CC576', // Light Yellow Green
'3BB878', // Light Green
'1ABBB4', // Light Green Cyan
'00BFF3', // Light Cyan
'438CCA', // Light Cyan Blue
'5574B9', // Light Blue
'605CA8', // Light Blue Violet
'855FA8', // Light Violet
'A763A8', // Light Violet Magenta
'F06EA9', // Light Magenta
'F26D7D'  // Light Magenta Red
];
Map.addLayer(nlcd.select('landcover'), {palette:colorsRainbow}, 'NLCD')