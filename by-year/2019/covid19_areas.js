/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gadm = ee.FeatureCollection("users/gena/GADM36"),
    areas_nl = ee.FeatureCollection("users/gena/covid19/covid19_nl_new"),
    areas_it = ee.FeatureCollection("users/gena/covid19/areas/lookup_areas_IT");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Export.table.toAsset(areas_it.filter(ee.Filter.eq('dt', 1583136000000)), 'it', 'users/gena/covid19/areas/lookup_areas_it')

// var f = areas_nl.filter(ee.Filter.eq('dt', '2020-03-10'))
// print(f.filter(ee.Filter.eq('.geo', null)))
// Export.table.toAsset(f, 'nl', 'users/gena/covid19/areas/lookup_areas_nl')

Map.addLayer(areas_it)


// England,Barking and Dagenham
// England,Barnet
// England,Barnsley
// England,Bath and North East Somerset
// England,Bedford
// England,Bexley
// England,Birmingham
// England,Blackburn with Darwen
// England,Blackpool
// England,Bolton
// England,Bournemouth
// England,Bracknell Forest
// England,Bradford
// England,Brent
// England,Brighton and Hove
// England,Bristol
// England,Bromley
// England,Buckinghamshire
// England,Bury
// England,Calderdale
// England,Cambridgeshire
// England,Camden
// England,Central Bedfordshire
// England,Cheshire East
// England,Cheshire West and Chester
// England,Cornwall and Isles of Scilly
// England,County Durham
// England,Coventry
// England,Croydon
// England,Cumbria
// England,Darlington
// England,Derby
// England,Derbyshire
// England,Devon
// England,Doncaster
// England,Dorset
// England,Dudley
// England,Ealing
// England,East Riding of Yorkshire
// England,East Sussex
// England,Enfield
// England,Essex
// England,Gateshead
// England,Gloucestershire
// England,Greenwich
// England,Hackney and City of London
// England,Halton
// England,Hammersmith and Fulham
// England,Hampshire
// England,Haringey
// England,Harrow
// England,Hartlepool
// England,Havering
// England,Herefordshire
// England,Hertfordshire
// England,Hillingdon
// England,Hounslow
// England,Isle of Wight
// England,Islington
// England,Kensington and Chelsea
// England,Kent
// England,Kingston upon Hull
// England,Kingston upon Thames
// England,Kirklees
// England,Knowsley
// England,Lambeth
// England,Lancashire
// England,Leeds
// England,Leicester
// England,Leicestershire
// England,Lewisham
// England,Lincolnshire
// England,Liverpool
// England,Luton
// England,Manchester
// England,Medway
// England,Merton
// England,Middlesbrough
// England,Milton Keynes
// England,Newcastle upon Tyne
// England,Newham
// England,Norfolk
// England,North East Lincolnshire
// England,North Lincolnshire
// England,North Somerset
// England,North Tyneside
// England,North Yorkshire
// England,Northamptonshire
// England,Northumberland
// England,Nottingham
// England,Nottinghamshire
// England,Oldham
// England,Oxfordshire
// England,Peterborough
// England,Plymouth
// England,Portsmouth
// England,Reading
// England,Redbridge
// England,Redcar and Cleveland
// England,Richmond upon Thames
// England,Rochdale
// England,Rotherham
// England,Rutland
// England,Salford
// England,Sandwell
// England,Sefton
// England,Sheffield
// England,Shropshire
// England,Slough
// England,Solihull
// England,Somerset
// England,South Gloucestershire
// England,South Tyneside
// England,Southampton
// England,Southend-on-Sea
// England,Southwark
// England,St. Helens
// England,Staffordshire
// England,Stockport
// England,Stockton-on-Tees
// England,Stoke-on-Trent
// England,Suffolk
// England,Sunderland
// England,Surrey
// England,Sutton
// England,Swindon
// England,Tameside
// England,Telford and Wrekin
// England,Thurrock
// England,Torbay
// England,Tower Hamlets
// England,Trafford
// England,Wakefield
// England,Walsall
// England,Waltham Forest
// England,Wandsworth
// England,Warrington
// England,Warwickshire
// England,West Berkshire
// England,West Sussex
// England,Westminster
// England,Wigan
// England,Wiltshire
// England,Windsor and Maidenhead
// England,Wirral
// England,Wokingham
// England,Wolverhampton
// England,Worcestershire
// England,York
// Scotland,Ayrshire and Arran
// Scotland,Borders
// Scotland,Dumfries and Galloway
// Scotland,Fife
// Scotland,Forth Valley
// Scotland,Grampian
// Scotland,Greater Glasgow and Clyde
// Scotland,Highland
// Scotland,Lanarkshire
// Scotland,Lothian
// Scotland,Shetland
// Scotland,Tayside
// Wales,Blaenau Gwent County Borough Council
// Wales,Bridgend County Borough Council
// Wales,Caerphilly County Borough Council
// Wales,Carmarthenshire County Council
// Wales,Ceredigion County Council
// Wales,City and County of Swansea
// Wales,City of Cardiff Council
// Wales,Conwy County Borough Council
// Wales,Denbighshire County Council
// Wales,Flintshire County Council
// Wales,Gwynedd Council
// Wales,Isle of Anglesey County Council
// Wales,Merthyr Tydfil County Borough Council
// Wales,Monmouthshire County Council
// Wales,Neath Port Talbot Council
// Wales,Newport City Council
// Wales,Pembrokeshire County Council
// Wales,Powys County Council
// Wales,Resident outside Wales
// Wales,Residential area to be confirmed
// Wales,Rhondda Cynon Taf County Borough Council
// Wales,Torfaen County Borough Council
// Wales,Vale of Glamorgan Council
// Wales,Wrexham County Borough Council
// SE,Blekinge
// SE,Dalarna
// SE,Gotland
// SE,Gävleborg
// SE,Halland
// SE,Jämtland
// SE,Jönköping
// SE,Kalmar
// SE,Kronoberg
// SE,Norrbotten
// SE,Skåne
// SE,Stockholm
// SE,Södermanland
// SE,Uppsala
// SE,Värmland
// SE,Västerbotten
// SE,Västernorrland
// SE,Västmanland
// SE,Västra Götaland
// SE,Örebro
// SE,Östergötland

var aggregations = [
  {
    country: 'AT',
    level: 1,
    areas: [
      'Burgenland',
      'Kärnten',
      'Niederösterreich',
      'Oberösterreich',
      'Salzburg',
      'Steiermark',
      'Tirol',
      'Vorarlberg',
      'Wien'
    ]
  },
  {
    country: 'DE',
    level: 1,
    areas: [
      'Baden-Württemberg',
      'Bayern',
      'Berlin',
      'Brandenburg',
      'Bremen',
      'Hamburg',
      'Hessen',
      'Mecklenburg-Vorpommern',
      'Niedersachsen',
      'Nordrhein-Westfalen',
      { original: 'Repatriierte', skip: true },
      'Rheinland-Pfalz',
      'Saarland',
      'Sachsen',
      'Sachsen-Anhalt',
      'Schleswig-Holstein',
      'Thüringen'
    ]
  },
  {
    country: 'FR',
    level: 1,
    areas: [
      'Auvergne-Rhône-Alpes',
      'Bourgogne-Franche-Comté',
      'Bretagne',
      'Centre-Val de Loire',
      'Corse',
      'Grand Est',
      { original: 'Guadeloupe', skip: true },
      { original: 'Guyane', skip: true },
      'Hauts-de-France',
      { original: 'Ile-de-France', name: 'Île-de-France', level: 1  },
      { original: 'La Réunion', skip: true },
      { original: 'Martinique', skip: true },
      { original: 'Mayotte', skip: true },
      { original: 'Metropolis', name: 'Île-de-France', level: 1 },
      'Normandie',
      'Nouvelle-Aquitaine',
      'Occitanie',
      { original: 'Oversea', skip: true },
      'Pays de la Loire',
      { original: 'Provence-Alpes-Côte d’Azur', name: "Provence-Alpes-Côte d'Azur", level: 1 },
      { original: 'Saint-Barthélémy', skip: true },
      { original: 'Saint-Martin', skip: true },
    ]
  },
  {
    country: 'IT',
    lookupFeatures: areas_it,
    lookupField: 'prov_name',
    areas: [
      'Agrigento',
      'Alessandria',
      'Ancona',
      { original: 'Aosta', name: "Valle d'Aosta/Vallée d'Aoste", level: 2 },
      'Arezzo',
      'Ascoli Piceno',
      'Asti',
      'Avellino',
      'Bari',
      'Barletta-Andria-Trani',
      'Belluno',
      'Benevento',
      'Bergamo',
      'Biella',
      'Bologna',
      { original: 'Bolzano', name: "Bolzano/Bozen", level: 2 },
      'Brescia',
      'Brindisi',
      'Cagliari',
      'Caltanissetta',
      'Campobasso',
      'Caserta',
      'Catania',
      'Catanzaro',
      'Chieti',
      'Como',
      'Cosenza',
      'Cremona',
      'Crotone',
      'Cuneo',
      'Enna',
      'Fermo',
      'Ferrara',
      'Firenze',
      'Foggia',
      'Forlì-Cesena',
      'Frosinone',
      'Genova',
      'Gorizia',
      'Grosseto',
      'Imperia',
      'Isernia',
      "L'Aquila",
      'La Spezia',
      'Latina',
      'Lecce',
      'Lecco',
      'Livorno',
      'Lodi',
      'Lucca',
      'Macerata',
      'Mantova',
      { original: 'Massa Carrara', name: "Massa-Carrara", level: 2 },
      'Matera',
      'Messina',
      'Milano',
      'Modena',
      'Monza e della Brianza',
      'Napoli',
      'Novara',
      'Nuoro',
      'Oristano',
      'Padova',
      'Palermo',
      'Parma',
      'Pavia',
      'Perugia',
      'Pesaro e Urbino',
      'Pescara',
      'Piacenza',
      'Pisa',
      'Pistoia',
      'Pordenone',
      'Potenza',
      'Prato',
      'Ragusa',
      'Ravenna',
      "Reggio di Calabria",
      "Reggio nell'Emilia",
      'Rieti',
      'Rimini',
      'Roma',
      'Rovigo',
      'Salerno',
      'Sassari',
      'Savona',
      'Siena',
      "Siracusa",
      'Sondrio',
      "Sud Sardegna",
      'Taranto',
      'Teramo',
      'Terni',
      'Torino',
      'Trapani',
      'Trento',
      'Treviso',
      'Trieste',
      'Udine',
      'Varese',
      'Venezia',
      'Verbano-Cusio-Ossola',
      'Vercelli',
      'Verona',
      'Vibo Valentia',
      'Vicenza',
      'Viterbo' 
    ]
  },
  {
    country: 'NL',
    lookupFeatures: areas_nl,
    lookupField: 'name',
    areas: [
      "'s-Gravenhage",
      "'s-Hertogenbosch",
      "Aa en Hunze",
      "Aalsmeer",
      "Aalten",
      "Achtkarspelen",
      "Alblasserdam",
      "Albrandswaard",
      "Alkmaar",
      "Almelo",
      "Almere",
      "Alphen aan den Rijn",
      "Alphen-Chaam",
      "Altena",
      "Ameland",
      "Amersfoort",
      "Amstelveen",
      "Amsterdam",
      "Apeldoorn",
      "Appingedam",
      "Arnhem",
      "Assen",
      "Asten",
      "Baarle-Nassau",
      "Baarn",
      "Barendrecht",
      "Barneveld",
      "Beek",
      "BeekDaelen", 
      "Beekdaelen", 
      "Beemster",
      "Beesel",
      "Berg en Dal",
      "Berg en Dal",
      "Bergeijk",
      "Bergen (L)",
      "Bergen (NH)",
      "Bergen (NH.)",
      "Bergen op Zoom",
      "Berkelland", 
      "Bernheze",
      "Best",
      "Beuningen",
      "Beverwijk",
      "Bladel",
      "Blaricum",
      "Bloemendaal",
      "Bodegraven-Reeuwijk", 
      "Boekel",
      "Borger-Odoorn",
      "Borne",
      "Borsele",
      "Boxmeer",
      "Boxtel",
      "Breda",
      "Brielle",
      "Bronckhorst", 
      "Brummen",
      "Brunssum",
      "Bunnik",
      "Bunschoten",
      "Buren",
      "Capelle aan den IJssel",
      "Castricum",
      "Coevorden",
      "Cranendonck",
      "Cuijk",
      "Culemborg",
      "Dalfsen",
      "Dantumadiel", 
      "De Bilt",
      "De Fryske Marren", 
      "De Ronde Venen",
      "De Wolden",
      "Delft",
      "Delfzijl",
      "Den Helder",
      "Deurne",
      "Deventer",
      "Diemen",
      "Dinkelland",
      "Doesburg",
      "Doetinchem",
      "Dongen",
      "Dordrecht",
      "Drechterland",
      "Drimmelen",
      "Dronten",
      "Druten",
      "Duiven",
      "Echt-Susteren",
      "Edam-Volendam",
      "Ede",
      "Eemnes",
      "Eersel",
      "Eijsden-Margraten", 
      "Eindhoven",
      "Elburg",
      "Emmen",
      "Enkhuizen",
      "Enschede",
      "Epe",
      "Ermelo",
      "Etten-Leur",
      "Geertruidenberg",
      "Geldrop-Mierlo", 
      "Gemert-Bakel",
      "Gennep",
      "Gilze en Rijen",
      "Goeree-Overflakkee", 
      "Goes",
      "Goirle",
      "Gooise Meren", 
      "Gorinchem",
      "Gouda",
      "Grave",
      "Groningen",
      "Gulpen-Wittem",
      "Haaksbergen",
      "Haaren",
      "Haarlem",
      "Haarlemmermeer",
      "Halderberge",
      "Hardenberg",
      "Harderwijk",
      "Hardinxveld-Giessendam",
      "Harlingen",
      "Hattem",
      "Heemskerk",
      "Heemstede",
      "Heerde",
      "Heerenveen",
      "Heerhugowaard",
      "Heerlen",
      "Heeze-Leende",
      "Heiloo",
      "Hellendoorn",
      "Hellevoetsluis",
      "Helmond",
      "Hendrik-Ido-Ambacht",
      "Hengelo",
      "Hengelo (O)", 
      "Het Hogeland", 
      "Heumen",
      "Heusden",
      "Hillegom",
      "Hilvarenbeek",
      "Hilversum",
      "Hoeksche Waard", 
      "Hof van Twente",
      "Hollands Kroon", 
      "Hoogeveen",
      "Hoorn",
      "Horst aan de Maas",
      "Houten",
      "Huizen",
      "Hulst",
      "IJsselstein",
      "Kaag en Braassem", 
      "Kampen",
      "Kapelle",
      "Katwijk",
      "Kerkrade",
      "Koggenland",
      "Krimpen aan den IJssel",
      "Krimpenerwaard", 
      "Laarbeek",
      "Landerd",
      "Landgraaf",
      "Landsmeer",
      "Langedijk",
      "Lansingerland", 
      "Laren",
      "Leeuwarden",
      "Leiden",
      "Leiderdorp",
      "Leidschendam-Voorburg",
      "Lelystad",
      "Leudal", 
      "Leusden",
      "Lingewaard",
      "Lisse",
      "Lochem",
      "Loon op Zand",
      "Lopik",
      "Loppersum",
      "Losser",
      "Maasdriel",
      "Maasgouw", 
      "Maassluis",
      "Maastricht",
      "Medemblik",
      "Meerssen",
      "Meierijstad", 
      "Meppel",
      "Middelburg",
      "Midden-Delfland", 
      "Midden-Drenthe",
      "Midden-Groningen",
      "Mill en Sint Hubert",
      "Moerdijk",
      "Molenlanden", 
      "Montferland", 
      "Montfoort",
      "Mook en Middelaar",
      "Neder-Betuwe",
      "Nederweert",
      "Nieuwegein",
      "Nieuwkoop",
      "Nijkerk",
      "Nijmegen",
      "Nissewaard",
      "Noardeast-Fryslân",
      "Noord-Beveland",
      "Noordenveld",
      "Noordoostpolder",
      "Noordwijk",
      "Nuenen",
      "Nunspeet",
      "Oegstgeest",
      "Oirschot",
      "Oisterwijk",
      "Oldambt",
      "Oldebroek",
      "Oldenzaal",
      "Olst-Wijhe",
      "Ommen",
      "Oost Gelre",
      "Oosterhout",
      "Ooststellingwerf",
      "Oostzaan",
      "Opmeer",
      "Opsterland",
      "Oss",
      "Other",
      "Oude IJsselstreek",
      "Ouder-Amstel",
      "Oudewater",
      "Overbetuwe",
      "Papendrecht",
      "Peel en Maas",
      "Pekela",
      "Pijnacker-Nootdorp",
      "Purmerend",
      "Putten",
      "Raalte",
      "Reimerswaal",
      "Renkum",
      "Renswoude",
      "Reusel-De Mierden",
      "Rheden",
      "Rhenen",
      "Ridderkerk",
      "Rijssen-Holten",
      "Rijswijk",
      "Roerdalen",
      "Roermond",
      "Roosendaal",
      "Rotterdam",
      "Rozendaal",
      "Rucphen",
      "Schagen",
      "Scherpenzeel",
      "Schiedam",
      "Schiermonnikoog",
      "Schouwen-Duiveland",
      "Simpelveld",
      "Sint Anthonis",
      "Sint-Michielsgestel",
      "Sittard-Geleen",
      "Sliedrecht",
      "Sluis",
      "Smallingerland",
      "Soest",
      "Someren",
      "Son en Breugel",
      "Stadskanaal",
      "Staphorst",
      "Stede Broec",
      "Steenbergen",
      "Steenwijkerland",
      "Stein",
      "Stichtse Vecht",
      "Súdwest Fryslân",
      "Súdwest-Fryslân",
      "Terneuzen",
      "Terschelling",
      "Texel",
      "Teylingen",
      "Tholen",
      "Tiel",
      "Tilburg",
      "Tubbergen",
      "Twenterand",
      "Tynaarlo",
      "Tytsjerksteradiel",
      "Uden",
      "Uitgeest",
      "Uithoorn",
      "Urk",
      "Utrecht",
      "Utrechtse Heuvelrug",
      "Vaals",
      "Valkenburg aan de Geul",
      "Valkenswaard",
      "Veendam",
      "Veenendaal",
      "Veere",
      "Veldhoven",
      "Velsen",
      "Venlo",
      "Venray",
      "Vijfheerenlanden",
      "Vlaardingen",
      "Vlieland",
      "Vlissingen",
      "Voerendaal",
      "Voorschoten",
      "Voorst",
      "Vught",
      "Waadhoeke",
      "Waalre",
      "Waalwijk",
      "Waddinxveen",
      "Wageningen",
      "Wassenaar",
      "Waterland",
      "Weert",
      "Weesp",
      "West Betuwe",
      "West Maas en Waal",
      "Westerkwartier",
      "Westerveld",
      "Westervoort",
      "Westerwolde",
      "Westland",
      "Weststellingwerf",
      "Westvoorne",
      "Wierden",
      "Wijchen",
      "Wijdemeren",
      "Wijk bij Duurstede",
      "Winterswijk",
      "Woensdrecht",
      "Woerden",
      "Wormerland",
      "Woudenberg",
      "Zaanstad",
      "Zaltbommel",
      "Zandvoort",
      "Zeewolde",
      "Zeist",
      "Zevenaar",
      "Zoetermeer",
      "Zoeterwoude",
      "Zuidplas",
      "Zundert",
      "Zutphen",
      "Zwartewaterland",
      "Zwijndrecht",
      "Zwolle"
    ]
  },
  {
    country: 'UK',
    level: 2,
    GID_0: 'GBR',
    areas: [
      "Barking and Dagenham",
      "Barnet",
      "Barnsley",
      "Bath and North East Somerset",
      "Bedford",
      "Bexley",
      "Birmingham",
      "Blackburn with Darwen",
      "Blackpool",
      "Bolton",
      "Bournemouth",
      "Bracknell Forest",
      "Bradford",
      "Brent",
      "Brighton and Hove",
      "Bristol",
      "Bromley",
      "Buckinghamshire",
      "Bury",
      "Calderdale",
      "Cambridgeshire",
      "Camden",
      "Central Bedfordshire",
      "Cheshire East",
      "Cheshire West and Chester",
      "City of London",
      // { original: "City of London", name: 'Greater London', level: 2 },
      "Cornwall",
      "Cornwall and Isles of Scilly",
      "County Durham",
      "Coventry",
      "Croydon",
      "Cumbria",
      "Darlington",
      "Derby",
      "Derbyshire",
      "Devon",
      "Doncaster",
      "Dorset",
      "Dudley",
      "Ealing",
      "East Riding of Yorkshire",
      "East Sussex",
      "Enfield",
      "Essex",
      "Gateshead",
      "Gloucestershire",
      "Greenwich",
      "Hackney",
      "Hackney and City of London",
      "Halton",
      "Hammersmith and Fulham",
      "Hampshire",
      "Haringey",
      "Harrow",
      "Hartlepool",
      "Havering",
      "Herefordshire",
      "Hertfordshire",
      "Hillingdon",
      "Hounslow",
      "Isle of Wight",
      "Isles of Scilly",
      "Islington",
      "Kensington and Chelsea",
      "Kent",
      "Kingston upon Hull",
      "Kingston upon Thames",
      "Kirklees",
      "Knowsley",
      "Lambeth",
      "Lancashire",
      "Leeds",
      "Leicester",
      "Leicestershire",
      "Lewisham",
      "Lincolnshire",
      "Liverpool",
      "Luton",
      "Manchester",
      "Medway",
      "Merton",
      "Middlesbrough",
      "Milton Keynes",
      "Newcastle upon Tyne",
      "Newham",
      "Norfolk",
      "North East Lincolnshire",
      "North Lincolnshire",
      "North Somerset",
      "North Tyneside",
      "North Yorkshire",
      "Northamptonshire",
      "Northumberland",
      "Nottingham",
      "Nottinghamshire",
      "Oldham",
      "Oxfordshire",
      "Peterborough",
      "Plymouth",
      "Poole",
      "Portsmouth",
      "Reading",
      "Redbridge",
      "Redcar and Cleveland",
      "Richmond upon Thames",
      "Rochdale",
      "Rotherham",
      "Rutland",
      "Salford",
      "Sandwell",
      "Sefton",
      "Sheffield",
      "Shropshire",
      "Slough",
      "Solihull",
      "Somerset",
      "South Gloucestershire",
      "South Tyneside",
      "Southampton",
      "Southend-on-Sea",
      "Southwark",
      "St. Helens",
      "Staffordshire",
      "Stockport",
      "Stockton-on-Tees",
      "Stoke-on-Trent",
      "Suffolk",
      "Sunderland",
      "Surrey",
      "Sutton",
      "Swindon",
      "Tameside",
      "Telford and Wrekin",
      "Thurrock",
      "Torbay",
      "Tower Hamlets",
      "Trafford",
      "Wakefield",
      "Walsall",
      "Waltham Forest",
      "Wandsworth",
      "Warrington",
      "Warwickshire",
      "West Berkshire",
      "West Sussex",
      "Westminster",
      "Wigan",
      "Wiltshire",
      "Windsor and Maidenhead",
      "Wirral",
      "Wokingham",
      "Wolverhampton",
      "Worcestershire",
      "York"
    ]    
  }
]

var colors = ["8dd3c7","ffffb3","bebada","fb8072","80b1d3","fdb462","b3de69","fccde5","d9d9d9","bc80bd","ccebc5","ffed6f"]

function exportRegions(a) {
  var featuresArea = []
  
  a.areas.map(function(name, i) {
    var level = a.level
    
    var original = null
    if (name.constructor == Object) {
        if(name.skip) {
          return
        }
      
        level = name.level
        original = name.original
        name = name.name
    }
    
    var lookupFeatures = gadm
    var lookupField = 'NAME_' + level

    var features = lookupFeatures

    if(a.GID_0) {
      features = features.filter(ee.Filter.eq('GID_0', a.GID_0))
    }

    var features2 = features.filter(ee.Filter.eq(lookupField, name))
    
    var lookupField = 'NAME_' + 3
    var features3 = features.filter(ee.Filter.eq(lookupField, name))
    features = features2.merge(features3)
    

    if(a.lookupFeatures) {
      lookupFeatures = a.lookupFeatures
      lookupField = a.lookupField 
      features = lookupFeatures.filter(ee.Filter.eq(lookupField, name)).limit(1)
    }
    
    // print(name, features.size())

    var f = ee.Feature(features.geometry().dissolve(100), { country: a.country, name: name, area: features.geometry().area(10) })

    if (original !== null) {
      f = f.set({ original: original})
    }

    original = ee.Algorithms.If(ee.Algorithms.IsEqual(f.get('original'), null), f.get('name'), f.get('original'))
    f = f.set({ original: original})
    
    featuresArea.push(f)

    // // inspection
    // var color = colors[i%colors.length]
    // features = ee.FeatureCollection([f])
    // Map.addLayer(features.style({ fillColor: color, color: color, width: 0}), {}, a.country + ', ' + name)
  })
  
  featuresArea = ee.FeatureCollection(featuresArea).filter(ee.Filter.gt('area', 0))
  Map.addLayer(featuresArea, {}, a.country)
  
  Export.table.toAsset(featuresArea, a.country, 'users/gena/covid19/areas/country_areas_' + a.country)
}

// var at = aggregations[0]
// exportRegions(at)

// var de = aggregations[1]
// exportRegions(de)

// var fr = aggregations[2]
// exportRegions(fr)

var it = aggregations[3]
exportRegions(it)

// var nl = aggregations[4]
// exportRegions(nl)

// var uk = aggregations[5]
// exportRegions(uk)
