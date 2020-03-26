var covid19 = ee.FeatureCollection('users/gena/covid19/covid19')

print('Count: ', covid19.size())

var f = covid19.first()

print('Date: ', f.get('dt'))
print('Name: ', f.get('name'))
print('Confirmed: ', f.get('confirmed'))
print('Recovered: ', f.get('recovered'))

var covid19Groupped = covid19.reduceColumns({
    selectors: ['dt', 'confirmed', 'recovered', 'deaths' ],
    reducer: ee.Reducer.sum().repeat(3)
    
    .group({
      groupField: 0,
      groupName: 'dt'
    })
})

covid19Groupped.evaluate(function(data) {
  var table = {
    cols: [
      { label: 'date', type: 'date' },
      { label: 'confirmed', type: 'number' },
      { label: 'recovered', type: 'number' },
      { label: 'deaths', type: 'number' }
    ],
    rows: []
  }
  
  print(data.groups)

  data.groups.map(function(o) {
    var c = [ 
      { v: new Date(Date.parse(o.dt)) }, 
      { v: o.sum[0] }, 
      { v: o.sum[1] }, 
      { v: o.sum[2] }
    ]
    table.rows.push({ c: c })
  })
  
  print(table)
  
  print(ui.Chart(table))
})

Map.addLayer(covid19.filter(ee.Filter.eq('dt', '2020-03-13')))