/*Modified code from using geojson with leaflet tutorial/geog575 github */
/*Written by Nolan Hegge 2/19/26*/

//create a map and center it 
var map = L.map('map').setView([43.075968, -107.290284], 5);

//use https tiles (avoid mixed content)
var tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

//create a geojson feature, in this case we are creating WYOMING (YAYYYYY)
var geojsonFeature = {
    "type": "Feature",
    "properties": {
        "name": "Wyoming",
        "amenity": "State",
        "popupContent": "This is the best place in the entire world!"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-107.290284,43.075968]
    }
};

//making an array of different geojson features
var myLines = [{
    "type": "LineString",
    "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
}, {
    "type": "LineString",
    "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
}];

//add the geojson to map
L.geoJSON(geojsonFeature).addTo(map);

//styling for the lines for lines
var myStyle = {
    "color": "#ff4200",
    "weight": 5,
    "opacity": 0.8
};

//add the style config object with lines
L.geoJSON(myLines, {
    style: myStyle
}).addTo(map);


//create an array of geojson features with different party attribute
var states = [{
    "type": "Feature",
    "properties": {"party": "Republican"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-104.05, 48.99],
            [-97.22,  48.98],
            [-96.58,  45.94],
            [-104.03, 45.94],
            [-104.05, 48.99]
        ]]
    }
}, {
    "type": "Feature",
    "properties": {"party": "Democrat"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-109.05, 41.00],
            [-102.06, 40.99],
            [-102.03, 36.99],
            [-109.04, 36.99],
            [-109.05, 41.00]
        ]]
    }
}];

//style the states depending on their political party
L.geoJSON(states, {
    style: function(feature) {
        switch (feature.properties.party) {
            case 'Republican': return {color: "#ff0000"};
            case 'Democrat':   return {color: "#0000ff"};
        }
    }
}).addTo(map);

//add geojson as circle marker and apply the syling
var geojsonMarkerOptions = {
    radius: 8,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

L.geoJSON(geojsonFeature, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    }
}).addTo(map);


//add a popup if geojson feature has attribute
function onEachFeature(feature, layer) {
    // check if the feature has a property named popupContent?
    if (feature.properties && feature.properties.popupContent) {
        layer.bindPopup(feature.properties.popupContent);
    }
}

L.geoJSON(geojsonFeature, {
    onEachFeature: onEachFeature
}).addTo(map);

//create some geojson points for wyoming
var someFeatures = [{
    "type": "Feature",
    "properties": {
        "name": "Douglas city",
        "show_on_map": true
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-105.38, 42.75]
    }
}, {
    "type": "Feature",
    "properties": {
        "name": "Dubois town",
        "show_on_map": false
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-109.64, 43.54]
    }
}];

//add features and filter to control visibility
L.geoJSON(someFeatures, {
    filter: function(feature, layer) {
        return feature.properties.show_on_map;
    }
}).addTo(map);