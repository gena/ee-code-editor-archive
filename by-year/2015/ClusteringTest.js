// Clustering example 1

var imageOriginal = ee.ImageCollection("NAIP/WI_2010").mosaic().normalizedDifference(["R", "N"])

var maxObjectSize = 256;

// The RegionGrow algorithm has these arguments:
// threshold - The maximum distance for inclusion in the current cluster.
// useCosine - Whether to use cosine distance instead of euclidean distance
//     when computing the spectral distance.
// secondPass - Apply a refinement pass to the clustering results.
var imageClustered = ee.apply("Test.Clustering.RegionGrow", {
  "image": imageOriginal,
  "useCosine": false,
  "threshold": 0.1,
  "maxObjectSize": maxObjectSize,
});

var imageConsistent = ee.apply("Test.Clustering.SpatialConsistency", {
  "image": imageClustered,
  "maxObjectSize": maxObjectSize
});

addToMap(imageOriginal, {}, "Original");
// Uncomment this line to see the per-tile clustering output
addToMap(imageConsistent.select('clusters').randomVisualizer(), {}, "Consistent");