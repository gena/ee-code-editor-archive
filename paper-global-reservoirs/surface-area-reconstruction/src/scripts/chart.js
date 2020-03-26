let app = function () {
    let aoi = ee.Geometry(Map.getBounds(true));

    let start = '2016-01-01';
    let stop = '2016-03-01';

    let resolutionMin = 500;

    // var showChart = false
    let showChart = true;

    // number of video frames to add for preview
    // layers can be also added by clicking on chart
    let countMapLayers = 0;

    // max number of map layers to add when clicked on chart, when max is reached - bottom layers are removed (FIFO)
    let countChartLayersMax = 20;

    print(start + '..' + stop);

    if (Map.getScale() > 300) {
        print('Zoom in to at least 300m scale, curren scale is: ' + Map.getScale());

        return;
    }

    let skip = [
        //'ASTER T',
        //'ASTER'
        //'Landsat 8',
        //'Landsat 7',
        //'Landsat 5',
        //'Landsat 4',
        //'Sentinel 2',
        //'PROBA-V 100m',
        //'PROBA-V 333m',
        //'MODIS Aqua MYD09GQ',
        //'MODIS Terra MOD09GQ',
        //'Sentinel 1 VV',
        //'Sentinel 1 VH',  // too noisy
        //'Sentinel 1 VV+VH',
        //'Sentinel 1 HH+HV',
    ];

    // global filter
    let filter = ee.Filter.and(
        ee.Filter.bounds(aoi),
        ee.Filter.date(start, stop)
    );

    // generate rendered image collections
    let rendered = collections.map(function (collection) {
        if (skip.indexOf(collection.name) != -1 || collection.resolution > resolutionMin) {
            return ee.ImageCollection([])
        }

        // combine global filter with custom asset filter
        let f = collection.filter ? ee.Filter.and(filter, collection.filter) : filter;

        // render all images, keep id and time
        let rendered = ee.ImageCollection(collection.asset)
            .select(collection.bands.native, collection.bands.readable)

            // filter
            .filter(f)

            // skip empty images
            .map(function (image) {
                let value = ee.Dictionary(image.select(collection.visual.bands[0]).reduceRegion(ee.Reducer.firstNonNull(), aoi.centroid(30), 100)).values().get(0);
                return image.set('any_value', value)
            }).filter(ee.Filter.neq('any_value', null))

            // render
            .map(function (image) {
                return image
                    .visualize(collection.visual)
                    .addBands(ee.Image.constant(275 + 35 * collections.indexOf(collection)).rename(collection.nameShort), [collection.nameShort]) // for chart
                    .set('system:time_start', image.get('system:time_start'))
                    .set('system:id', image.get('system:id'))
                    .set('short_name', collection.nameShort)
            });

        print(collection.name, rendered.aggregate_count('system:id'));

        return rendered
    });


     // merge all rendered collections and sort by time
    function mergeCollection(current, prev) {
        return ee.ImageCollection(prev).merge(current)
    }

    let videoFrames = ee.ImageCollection(ee.List(rendered).iterate(mergeCollection, ee.ImageCollection([]))).sort('system:time_start');
   
    // add text 
    function addDate(i) {
      var str = i.date().format('YYYY-MM-dd HH:mm')
      
      var textDate = Text.draw(str, Map.getCenter(), Map.getScale(), {
          outlineColor: '000000',
          outlineWidth: 2,
          outlineOpacity: 0.6,
          fontSize: 16,
          textColor: 'white'
      });
      
      return ee.ImageCollection.fromImages([
          i.visualize({forceRgbOutput: true}),
          textDate.visualize({forceRgbOutput: true}),
        ]).mosaic()
        
    }

    // show a few video frames as map layers
    let list = videoFrames.toList(countMapLayers);
    ee.List.sequence(0, countMapLayers - 1).getInfo(function (indices) {
        indices.map(function (index) {
            let image = ee.Image(list.get(index));

            let layer = ui.Map.Layer(addDate(image), {}, index.toString(), false);
            image.get('system:id').getInfo(function (id) {
                layer.setName(layer.getName() + ' ' + id)
            });
            Map.layers().add(layer)
        });

        // initialize chart
        initChart();
    });

    // add chart when no map layers are added
    if (!countMapLayers) {
        initChart();
    }

    /***
     * Adds chart showing all images available at the Map center
     */
    function initChart() {
        if (!showChart) {
            return
        }

        addTimelineChart(ee.Geometry(Map.getCenter(true)).centroid(10));

        Map.onClick(function (coords) {
            coords = ee.Dictionary(coords);
            print('Map clicked: ', coords);
            let newCenter = ee.Geometry.Point([coords.get('lon'), coords.get('lat')]);
            addTimelineChart(newCenter)
        })
    }

    // export
    Export.video.toDrive({
        collection: videoFrames.map(addDate),
        description: 'all-images',
        dimensions: 1920,
        framesPerSecond: 1,
        region: ee.Geometry(Map.getBounds(true)),
        crs: 'EPSG: 3857'
    });

    // print total count
    print('Total: ', videoFrames.aggregate_count('system:id'));

    // chart layers
    let chartLayers = new Queue();

    function addImageAsChartLayer(layer) {
        let layers = Map.layers();

        // remove last chart layer, if necessary
        if (chartLayers.length() >= countChartLayersMax) {
            let removed = chartLayers.dequeue();
            layers.remove(removed);
            print('Removed layer: ' + removed.getName())
        }

        // add a new layer on top of the layer
        layers.insert(layers.length() - 1, layer);

        // add to queue
        chartLayers.enqueue(layer);
        print('Added layer: ', layer.getEeObject())
    }

    // show a chart with all selected images at a given location
    function addTimelineChart(point) {
        // update aoi (clicked point) layer
        Map.layers().forEach(function (layer) {
            if (layer.getName() === 'aoi') {
                Map.layers().remove(layer);

            }
        });

        let pointLayer = ui.Map.Layer(point, {color: 'red', opacity: 0.6}, 'aoi');
        Map.layers().add(pointLayer);

        // update chart and controls
        Map.widgets().reset();

        // create a label on the map.
        let label = ui.Label('... loading chart');
        Map.add(label);

        // update chart series options, this should be easier, but the ui.Chart is currently very limited, no evens like onDataLoad
        let features = ee.FeatureCollection(videoFrames.map(function (i) {
            let props = ee.Dictionary(i.reduceRegion(ee.Reducer.first(), point, 10));
            props = props.set('system:time_start', i.get('system:time_start'));

            return ee.Feature(null, props)
        }));

        // find unique property names, use to update series options
        features.toList(5000).map(function (f) {
            return ee.Feature(f).propertyNames().remove('system:id').remove('system:time_start').remove('system:index')
        }).flatten().sort().getInfo(function (bandNames) {
            let seriesCount = distinct(bandNames).length;

            // add chart
            let chart = ui.Chart.feature.byFeature(features, 'system:time_start');

            chart.setChartType('ScatterChart');

            let chartOptions = {
                title: null,
                chartArea: {width: '95%'},
                vAxis: {
                    viewWindow: {
                        max: 800,
                        min: 0
                    }
                    , textStyle: {fontSize: 12}
                },
                hAxis: {format: 'yyyy-MM-dd', gridlines: {count: 20}, textStyle: {fontSize: 12}},
                lineWidth: 1,
                //curveType: 'function',
                pointSize: 4,
                series: {}
            };

            // update series type for RGB bands
            chartOptions.series[seriesCount - 1] = {pointSize: 0, color: '#de2d26'};
            chartOptions.series[seriesCount - 2] = {pointSize: 0, color: '#31a354'};
            chartOptions.series[seriesCount - 3] = {pointSize: 0, color: '#2b8cbe'};

            chart.setOptions(chartOptions);

            chart.style().set({
                position: 'bottom-left',
                width: '98%',
                height: '250px',
            });

            Map.add(chart);

            // when the chart is clicked, update the map and label.
            chart.onClick(function (xValue, yValue, seriesName) {
                if (!seriesName || seriesName.indexOf('vis-') !== -1) {
                    print('Please select one of the sensor series');
                    return
                }

                if (!xValue) {
                    return;  // Selection was cleared.
                }

                // Show the image for the clicked date.
                let equalDate = ee.Filter.equals('system:time_start', xValue);
                let equalBand = ee.Filter.equals('short_name', seriesName);
                let image = ee.Image(videoFrames.filter(ee.Filter.and(equalDate, equalBand)).first());

                // Show a label with the date on the map.
                ee.String(ee.String(new Date(xValue).toUTCString()).cat(' ').cat(image.get('system:id'))).getInfo(function (str) {
                    label.setValue(str);

                    let layer = ui.Map.Layer(addDate(image), {}, 'chart');
                    addImageAsChartLayer(layer);
                    image.get('system:id').getInfo(function (id) {
                        layer.setName(layer.getName() + ' ' + id)
                    })
                })
            });

            // update label once chart is added
            label.setValue('Click a point on the chart to show the image for that date.')
        })
    }

    // set cursor is buggy
    //Map.style().set('cursor', 'crosshair');
};

