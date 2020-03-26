/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var cases = ee.FeatureCollection("users/gena/covid19/covid19");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
cases = cases.map(function(f) {
  return f.set({ name: ee.String(f.get('country')).cat(' ').cat(f.get('province')) })
})

// keep only Hubei from China
cases = cases.sort('t')

cases = cases.reduceColumns({
    selectors: ['name', 'confirmed', 'recovered', 'deaths', 'province' ],
    reducer: ee.Reducer.toList().repeat(4)
    
    .group({
      groupField: 0,
      groupName: 'name'
    })
})

var tableOptions = {
  deaths: {
    threshold: 1, // min number of cases
    variableIndex: 2, // deaths
    variableName: 'deaths',
    minValue: 0
  },
  recovered: {
    threshold: 10, // min number of cases
    variableIndex: 1, // deaths
    variableName: 'recovered',
    minValue: 500,
    minValueSteps: 25
  },
  confirmed: {
    threshold: 100, // min number of cases
    variableIndex: 0, // confirmed
    variableName: 'confirmed',
    minValue: 10, // should reach minValue within minValueSteps
    minValueSteps: 20 // number of steps where we're above given threshold
  }
}

function getPlotTable(data, options, onlyHubei) {
  var plotData = []

  data.groups.map(function(countryData) {
    // Keep only Hubei
    if (onlyHubei && countryData.name.indexOf('China') !== -1 && countryData.name.indexOf('Hubei') === -1) {
      return
    }

    var d = countryData.list[options.variableIndex]
    
    var index = -1;
    for (var i = 0; i < d.length; ++i) {
        if (d[i] >= options.threshold) {
            index = i
            break;
        }
    }
    
    // limit if value has N steps but did not reach M within N steps
    var include = true
    // if(index != -1 && minValue && countryData.list[variableIndex].slice(index).length >= minValueSteps) {
    //   if(countryData.list[variableIndex].slice(index)[minValueSteps] < minValue) {
    //     include = false
    //   }
    // }

    // add country data
    if(index != -1 && include) {
      plotData.push({
        name: countryData.name,
        confirmed: countryData.list[0].slice(index),
        recovered: countryData.list[1].slice(index),
        deaths: countryData.list[2].slice(index)
      })
    }
  })
  
  var rowCount = plotData.reduce(function(total, current) {
    return Math.max(current.confirmed.length, total)
  }, 0)
  
  // generate columns
  var cols = [
    { id: 'days', type: 'number' }
  ]
  
  plotData.map(function(d) {
    cols.push({
      label: d.name,
      type: 'number'
    })
  })


  var rows = []
  for(var i=0; i<rowCount; i++)
  {
    var c = []
    c.push({v: i})
    
    for(var j=0; j<plotData.length; j++) {
      var d = plotData[j][options.variableName]
      if(i >= d.length) {
        c.push({v: null})
      } else {
        c.push({v: d[i] })
      }
    }
    rows.push({c: c})
  }
  
  // convert to DataTable
  return { cols: cols, rows: rows }
}

function showComparison(data) {
  var checkboxOnlyHubei = ui.Checkbox('Keep only Hubei for China', true) 

  var currentVariable = 'confirmed'

  var chartOptions = { 
    title: currentVariable + ' cases per country, day 0 is when the number of cases reached ' + tableOptions[currentVariable].threshold,
    fontSize: 11,
    chartArea: { height: '80%', width: '90%'},
    // legend: { position: 'right', textStyle: {fontSize: 11}},
    pointSize: 2,
    lineWidth: 1,
    height: 530,
    hAxis: {
      viewWindow: { min: 0, max: 20 }
    },
    vAxis: { scaleType: 'none' },
  }
  
  checkboxOnlyHubei.onChange(function() {
    updateChart(currentVariable)
  })
  
  function updateChart(variable) {
    var table = getPlotTable(data, tableOptions[variable], checkboxOnlyHubei.getValue())
    var chart = ui.Chart(table).setChartType('ScatterChart').setOptions(chartOptions)
    panelChart.clear()
    panelChart.widgets().add(chart)
    
    chart.onClick(function(a,b,c) {
      print(a,b,c)
    })
  }

  var checkboxLog = ui.Checkbox('Log', false) 

  var selectVariable = ui.Select({ 
    items: Object.keys(tableOptions),
    value: 'confirmed',
    style: { padding: 0, margin: 0 }
  })
  
  checkboxLog.onChange(function onLogScale() {
    if(checkboxLog.getValue()) {
      chartOptions.vAxis = { scaleType: 'log' }
    } else {
      chartOptions.vAxis = { scaleType: 'none' }
    }
    
    updateChart(currentVariable)
  })
  
  selectVariable.onChange(function(v) {
    chartOptions.title = v + ' cases per country, day 0 is when the number of cases reached ' + tableOptions[v].threshold
    currentVariable = v
    updateChart(currentVariable)    
  })

  var choices = ui.Panel({ 
    widgets: [selectVariable, checkboxLog, checkboxOnlyHubei], 
    layout: ui.Panel.Layout.flow('horizontal') 
  })
  
  var panelChart = ui.Panel([])
  
  updateChart(currentVariable)
  
  var panel = ui.Panel({
    widgets: [panelChart, choices],
    style: {
      width: '800px',
      height: '600px',
      // position: 'bottom-right'
    }
  })
  
  Map.add(panel)
}

cases = cases.getInfo()

showComparison(cases)
