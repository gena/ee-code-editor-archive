var Algorithms = require('users/gena/packages2:algorithms.js').Algorithms

var collections = [{
    name: 'Sentinel 1 VV',
    nameShort: 'S1VV',
    asset: 'COPERNICUS/S1_GRD',
    type: 'radar',
    resolution: 10,
    filter: ee.Filter.and(
      ee.Filter.eq('transmitterReceiverPolarisation', 'VV'), 
      //ee.Filter.eq('system:index', 'S1A_IW_GRDH_1SSV_20150401T135830_20150401T135855_005291_006B13_303B')
      ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']).not()
      ),
    bands: {
        readable: ['VV'],
        native: ['VV']
    },
    visual: { bands: ['VV'], min: -20, max: -5, forceRgbOutput: true },
    algorithms: Algorithms.Sentinel1
}, {
    name: 'Sentinel 1 VH',
    nameShort: 'S1VH',
    asset: 'COPERNICUS/S1_GRD',
    type: 'radar',
    resolution: 10,
    filter: ee.Filter.and(
      ee.Filter.eq('transmitterReceiverPolarisation', 'VH'), 
      ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']).not()),
    bands: {
        readable: ['VH'],
        native: ['VH']
    },
    visual: { bands: ['VH'], min: -20, max: -5, forceRgbOutput: true },
    algorithms: Algorithms.Sentinel1
}, {
    name: 'Sentinel 1 VV+VH',
    nameShort: 'S1VVVH',
    asset: 'COPERNICUS/S1_GRD',
    type: 'radar',
    resolution: 10,
    filter: ee.Filter.and(
      ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH'])
    ),
    bands: {
        readable: ['VV', 'VH'],
        native: ['VV', 'VH']
    },
    visual: { bands: ['VV', 'VH', 'VV'], min: -20, max: -5 },
    algorithms: Algorithms.Sentinel1
}, {
    name: 'Sentinel 1 HH+HV',
    nameShort: 'S1HHHV',
    asset: 'COPERNICUS/S1_GRD',
    type: 'radar',
    resolution: 10,
    filter: ee.Filter.eq('transmitterReceiverPolarisation', ['HH', 'HV']),
    bands: {
        readable: ['HH', 'HV'],
        native: ['HH', 'HV']
    },
    visual: { bands: ['HH', 'HV', 'HH'], min: -20, max: -5 },
    algorithms: Algorithms.Sentinel1
}, {
    name: 'Landsat 8',
    nameShort: 'L8',
    asset: 'LANDSAT/LC8_L1T_TOA',
    type: 'optical',
    resolution: 15,
    bands: {
        readable: ['coastal', 'blue', 'green', 'red', 'nir', 'swir', 'swir2', 'pan', 'cirrus', 'temp', 'temp2', 'BQA'],
        native: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'BQA']
    },
    visual: { bands: ['swir', 'nir', 'green'], min: 0.03, max: 0.5 },
    algorithms: Algorithms.Landsat
}, {
    name: 'Landsat 7',
    nameShort: 'L7',
    asset: 'LANDSAT/LE7_L1T_TOA',
    type: 'optical',
    resolution: 15,
    bands: {
        readable: ['blue', 'green', 'red', 'nir', 'swir', 'swir2', 'temp', 'temp2', 'pan'],
        native: ['B1', 'B2', 'B3', 'B4', 'B5', 'B5', 'B6_VCID_2', 'B6_VCID_2', 'B8']
    },
    visual: { bands: ['swir', 'nir', 'green'], min: 0.03, max: 0.5 },
    algorithms: Algorithms.Landsat
}, {
    name: 'Landsat 5',
    nameShort: 'L5',
    asset: 'LANDSAT/LT5_L1T_TOA',
    type: 'optical',
    resolution: 30,
    bands: {
        readable: ['blue', 'green', 'red', 'nir', 'swir', 'swir2', 'temp'],
        native: ['B1', 'B2', 'B3', 'B4', 'B5', 'B5', 'B6']
    },
    visual: { bands: ['swir', 'nir', 'green'], min: 0.03, max: 0.5 },
    algorithms: Algorithms.Landsat
}, {
    name: 'Landsat 4',
    nameShort: 'L4',
    asset: 'LANDSAT/LT4_L1T_TOA',
    type: 'optical',
    resolution: 30,
    bands: {
        readable: ['blue', 'green', 'red', 'nir', 'swir', 'swir2', 'temp'],
        native: ['B1', 'B2', 'B3', 'B4', 'B5', 'B5', 'B6']
    },
    visual: { bands: ['swir', 'nir', 'green'], min: 0.03, max: 0.5 },
    algorithms: Algorithms.Landsat
}, {
    name: 'Sentinel 2',
    nameShort: 'S2',
    asset: 'COPERNICUS/S2',
    type: 'optical',
    resolution: 10,
    bands: {
        readable: ['coastal', 'blue', 'green', 'red', 'red2', 'red3', 'red4', 'nir', 'nir2', 'water_vapour', 'cirrus', 'swir', 'swir2', 'QA10', 'QA20', 'QA60'],
        native: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B10', 'B11', 'B12', 'QA10', 'QA20', 'QA60']
    },
    visual: { bands: ['green', 'nir', 'green'], min: 500, max: 7000 },
    unitScale: [0, 10000],
    algorithms: Algorithms.Sentinel2
}, {
    name: 'ASTER',
    nameShort: 'ASTER',
    asset: 'ASTER/AST_L1T_003',
    type: 'optical',
    resolution: 15,
    filter: ee.Filter.and(ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B01'), ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B3N'), ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B10'),
    //ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B04')
    ee.Filter.gt('SOLAR_ELEVATION', 0) // exclude night scenes

    ),
    bands: {
        readable: ['green', 'red', 'nir', 'swir', 'swir2', 'swir3', 'swir4', 'swir5', 'swir6', 'temp', 'temp2', 'temp3', 'temp4', 'temp5'],
        native: ['B01', 'B02', 'B3N', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11', 'B12', 'B13', 'B14']
    },
    //visual: {bands: ['swir', 'nir', 'green'], min:10, max:255},
    visual: { bands: ['green', 'nir', 'green'], min: 10, max: 255 },
    unitScale: [0, 255],
    algorithms: Algorithms.Aster
}, {
    name: 'ASTER T',
    nameShort: 'ASTER T',
    asset: 'ASTER/AST_L1T_003',
    type: 'optical',
    resolution: 90,
    filter: ee.Filter.and(ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B11'), ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B12'), ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B13'), ee.Filter.and(ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B01'), ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B3N')
    //ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B04')
    ).not()),
    bands: {
        readable: ['green', 'red', 'nir', 'swir', 'swir2', 'swir3', 'swir4', 'swir5', 'swir6', 'temp', 'temp2', 'temp3', 'temp4', 'temp5'],
        native: ['B01', 'B02', 'B3N', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11', 'B12', 'B13', 'B14']
    },
    visual: { bands: ['temp', 'temp3', 'temp5'], min: 600, max: 1800, forceRgbOutput: true },
    algorithms: Algorithms.AsterT
}, {
    name: 'PROBA-V 100m',
    nameShort: 'P1',
    asset: 'VITO/PROBAV/S1_TOC_100M',
    type: 'optical',
    resolution: 100,
    bands: {
        readable: ['blue', 'red', 'nir', 'swir', 'SM', 'time'],
        native: ['BLUE', 'RED', 'NIR', 'SWIR', 'SM', 'TIME']
    },

    visual: { bands: ['red', 'nir', 'red'], min: 10, max: 1000 },
    unitScale: [0, 1000],
    algorithms: Algorithms.Proba
}, {
    name: 'PROBA-V 333m',
    nameShort: 'P2',
    asset: 'VITO/PROBAV/S1_TOC_333M',
    type: 'optical',
    resolution: 333,
    bands: {
        readable: ['blue', 'red', 'nir', 'swir', 'SM', 'time'],
        native: ['BLUE', 'RED', 'NIR', 'SWIR', 'SM', 'TIME']
    },
    visual: { bands: ['red', 'nir', 'red'], min: 10, max: 500 },
    unitScale: [0, 1000],
    algorithms: Algorithms.Proba
}, {
    name: 'MODIS Aqua MYD09GQ',
    nameShort: 'AQUA',
    asset: 'MODIS/MYD09GQ',
    type: 'optical',
    resolution: 250,
    bands: {
        readable: ['red', 'nir', 'quality', 'coverage'],
        native: ['sur_refl_b01', 'sur_refl_b02', 'QC_250m', 'obscov']
    },
    visual: { bands: ['red', 'nir', 'red'], min: 500, max: 5000 },
    unitScale: [0, 10000],
    algorithms: Algorithms.Modis
}, {
    name: 'MODIS Terra MOD09GQ',
    nameShort: 'TERRA',
    asset: 'MODIS/MOD09GQ',
    type: 'optical',
    resolution: 250,
    bands: {
        readable: ['red', 'nir', 'quality', 'coverage'],
        native: ['sur_refl_b01', 'sur_refl_b02', 'QC_250m', 'obscov']
    },
    visual: { bands: ['red', 'nir', 'red'], min: 500, max: 5000 },
    unitScale: [0, 10000],
    algorithms: Algorithms.Modis
}];

exports.collections = collections