/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var proba100 = ee.ImageCollection("VITO/PROBAV/S1_TOC_100M");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// add PROBA100 image
var index = 6
var image = ee.Image(proba100.toList(1, index).get(0))
Map.addLayer(image, {bands: ['SWIR', 'NIR', 'RED'], min:50, max:1000}, 'PROBA100', true)


var testBits = function(image, bits){
    var pattern = 0;
    for (var i = 0; i < bits.length; i++){
       pattern += Math.pow(2, bits[i])
    }
    
    return image.bitwiseAnd(pattern).gt(0);
};


// 000=clear, 010=undefined, 011=cloud, 100=ice/snow, 001=shadow

var cloud = testBits(image.select('SM'), [1,2])
Map.addLayer(cloud.mask(cloud), {palette:['ff0000']}, 'cloud', false)

var snow = testBits(image.select('SM'), [3])
Map.addLayer(snow.mask(snow), {palette:['ffffff']}, 'ice/snow', false)

var shadow = testBits(image.select('SM'), [0])
Map.addLayer(shadow.mask(shadow), {palette:['ffff00']}, 'shadow', false)

var bad = testBits(image.select('SM'), [4,5,6,7])
Map.addLayer(bad.mask(bad), {palette:['ff00ff']}, 'bad', false)


/*
SM: Quality / Information band. Bitmask with the following values:
LeastSignificantBit 0-2: 000=clear, 010=undefined, 011=cloud, 100=ice/snow, 001=shadow.
LeastSignificantBit 3: 0=sea, 1=land (Pixels with value=land may include areas of sea.)
LeastSignificantBit 4-7: Good/bad indicators for SWIR,NIR,RED,BLUE respectively, where 1=good, 0=bad.
*/

