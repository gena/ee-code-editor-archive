// ========================== testing

var assert = {
    isTrue: function(assertionName, condition) {
        print(ee.String(ee.Algorithms.If(ee.Algorithms.IsEqual(condition, 1), ' passed: ', 'failed: ')).cat(assertionName))
    },

    isFalse: function(assertionName, condition) {
        print(ee.String(ee.Algorithms.If(ee.Algorithms.IsEqual(condition, 0), ' passed: ', 'failed: ')).cat(assertionName))
    }
}

var TestSuite = {
    probaTransformExtractTime: function() {
        // find image at location
        var pt = ee.Geometry.Point(-120.16, 39.38)
        var info = collections.getByName('PROBA-V 100m')

        // BUG: filterBounds() does not filter empty image
        var image = ee.Image(ee.ImageCollection(info.asset).select('TIME').filterBounds(pt)
            .map(function(i) {
                var valueExists = i.reduceRegion(ee.Reducer.first(), pt, 90).values().get(0)
                return i.set('value_exists', valueExists)
            }).filter(ee.Filter.neq('value_exists', null)).first())

        // get time
        var time = image.get('system:time_start')
        print('Start time: ', ee.Date(time).format('YYYY-MM-dd HH:ss'))

        // get time offset
        var offset = image.select('TIME').reduceRegion(ee.Reducer.first(), pt, 90).values().get(0)
        print('Time offset (minutes): ', offset)

        var expected = ee.Date(time).advance(offset, 'minute')
        print('Expected time: ', expected.format('YYYY-MM-dd HH:ss'))

        // Asserts, check if transform() changes time in a given image
        image = image.set('bounds', pt) // used within transform()

        image = info.transform(image)
        var actual = image.get('system:time_start')

        assert.isTrue('transform() should add time offset to system:time_start from TIME band for PROBA images',
            expected.millis().eq(actual))

    },

    run: function() {
        Object.keys(TestSuite).map(function(name) {
            if(name === 'run') {
                return
            }

            TestSuite[name]()
        })
    }
}

// TestSuite.run(); return
