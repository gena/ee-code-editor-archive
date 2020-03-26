/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var hyperion = ee.ImageCollection("EO1/HYPERION"),
    pt1 = /* color: #d63000 */ee.Geometry.MultiPoint(
        [[-120.1439094543457, 39.38089087540488],
         [-120.11425495147705, 39.31875845400649],
         [-120.10013580322266, 39.40195694924223],
         [-120.09429931640625, 39.403813951547946],
         [-120.13893127441406, 39.14766572724918],
         [-120.2395248413086, 38.99803586079222],
         [-120.22098541259766, 38.986428269430554],
         [-120.3277587890625, 38.82110867244756]]),
    pt2 = /* color: #98ff00 */ee.Geometry.MultiPoint(
        [[-120.1325798034668, 39.383400787894004],
         [-120.12957572937012, 39.38306908693028],
         [-120.12382507324219, 39.38804443586038],
         [-120.11979103088379, 39.383400787894004]]),
    pt3 = /* color: #0b4a8b */ee.Geometry.MultiPoint(
        [[-120.25754928588867, 38.89489632165364],
         [-120.25566101074219, 38.89577030296691],
         [-120.25660514831543, 38.897974705844035]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var image = hyperion
  .filterBounds(ee.Geometry(pt1).centroid(1))
  .toList(1, 0)
  .get(0)

print(ee.Image(image).bandNames())

var λ = [426.8200, 436.9900, 447.1700, 457.3400, 467.5200, 477.6900, 487.8700, 498.0400, 508.2200, 518.3900, 528.5700, 538.7400, 
548.9200, 559.0900, 569.2700, 579.4500, 589.6200, 599.8000, 609.9700, 620.1500, 630.3200, 640.5000, 650.6700, 660.8500, 
671.0200, 681.2000, 691.3700, 701.5500, 711.7200, 721.9000, 732.0700, 742.2500, 752.4300, 762.6000, 772.7800, 782.9500, 
793.1300, 803.3000, 813.4800, 823.6500, 833.8300, 844.0000, 854.1800, 864.3500, 874.5300, 884.7000, 894.8800, 905.0500, 
915.2300, 925.4100, 912.4500, 922.5400, 932.6400, 942.7300, 952.8200, 962.9100, 972.9900, 983.0800, 993.1700, 1003.300,
1013.300, 1023.400,1033.490,1043.590, 1053.690, 1063.790, 1073.890, 1083.990, 1094.090, 1104.190, 1114.190, 1124.280,
1134.3800, 1144.4800, 1154.5800, 1164.6800, 1174.7700, 1184.8700, 1194.9700, 1205.0700, 1215.1700, 1225.1700, 1235.2700, 
1245.3600, 1255.4600, 1265.5600, 1275.6600, 1285.7600, 1295.8600, 1305.9600, 1316.0500, 1326.0500, 1336.1500, 1346.2500, 
1356.3500, 1366.4500, 1376.5500, 1386.6500, 1396.7400, 1406.8400, 1416.9400, 1426.9400, 1437.0400, 1447.1400, 1457.2300, 
1467.3300, 1477.4300, 1487.5300, 1497.6300, 1507.7300, 1517.8300, 1527.9200, 1537.9200, 1548.0200, 1558.1200, 1568.2200, 
1578.3200, 1588.4200, 1598.5100, 1608.6100, 1618.7100, 1628.8100, 1638.8100, 1648.9000, 1659.0000, 1669.1000, 1679.2000, 
1689.3000, 1699.4000, 1709.5000, 1719.6000, 1729.7000, 1739.7000, 1749.7900, 1759.8900, 1769.9900, 1780.0900, 1790.1900, 
1800.2900, 1810.3800, 1820.4800, 1830.5800, 1840.5800, 1850.6800, 1860.7800, 1870.8700, 1880.9800, 1891.0700, 1901.1700, 
1911.2700, 1921.3700, 1931.4700, 1941.5700, 1951.5700, 1961.6600, 1971.7600, 1981.8600, 1991.9600, 2002.0600, 2012.1500, 
2022.2500, 2032.3500, 2042.4500, 2052.4500, 2062.5500, 2072.6500, 2082.7500, 2092.8400, 2102.9400, 2113.0400, 2123.1400, 
2133.2400, 2143.3400, 2153.3400, 2163.4300, 2173.5300, 2183.6300, 2193.7300, 2203.8300, 2213.9300, 2224.0300, 2234.1200, 
2244.2200, 2254.2200, 2264.3200, 2274.4200, 2284.5200, 2294.6100, 2304.7100, 2314.8100, 2324.9100, 2335.0100, 2345.1100, 
2355.2100, 2365.2000, 2375.3000, 2385.4000, 2395.5000]
  
image = ee.Image(image)

Map.addLayer(image, {bands:['B107', 'B031', 'B044'], min: 100, max:3000})

var buffer = 60
Map.addLayer(pt1.buffer(buffer))

var result = ee.ImageCollection.fromImages([image]).getRegion(pt1.buffer(buffer), 30).slice(1).map(function(l) { return ee.List(l).slice(4) })
var chart = ui.Chart.array.values(result, 1, λ)
chart.setOptions({pointSize: 0.5, vAxis: { viewWindowMode:'explicit', viewWindow:{min:0, max: 8000}}})
print(chart)

var result = ee.ImageCollection.fromImages([image]).getRegion(pt2.buffer(buffer), 30).slice(1).map(function(l) { return ee.List(l).slice(4) })
var chart = ui.Chart.array.values(result, 1, λ)
chart.setOptions({pointSize: 0.5, vAxis: { viewWindowMode:'explicit', viewWindow:{min:0, max: 8000}}})
print(chart)

var result = ee.ImageCollection.fromImages([image]).getRegion(pt3.buffer(buffer), 30).slice(1).map(function(l) { return ee.List(l).slice(4) })
var chart = ui.Chart.array.values(result, 1, λ)
chart.setOptions({pointSize: 0.5, vAxis: { viewWindowMode:'explicit', viewWindow:{min:0, max: 8000}}})
print(chart)

return
result = result.get('array');
var array = ee.Array(result.getInfo());
print(array);
var xValues = array.slice(1, 0, 1).project([0]);
print(xValues);
var yValues = array.slice(1, 1, 3);
print(yValues);

var chart = Chart.array.values(yValues, 0, xValues);
chart = chart.setSeriesNames(['B5', 'B6']);
chart = chart.setOptions({
  'title': 'LC8 TOA B4 vs. B6/B5',
  'hAxis': {'title': 'B4'},
  'vAxis': {'title': 'B5/B6'}
});
print(chart);

Map.addLayer(sanFrancisco);
Map.setCenter(-122.47, 37.77, 9);
