/*Modified code from Leaflet Quick Start Guide/geog575 github */
/*Written by Nolan Hegge 2/19/26*/


//create a leaflet map and set the starting view
var map = L.map('map').setView([51.505, -0.09], 13);

//add tile layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
   maxZoom: 19,
   attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//add a market to the map
var marker = L.marker([51.5, -0.09]).addTo(map);

//add a custom circle to the map
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,    radius: 500
}).addTo(map);

//add a custom polygon to the map
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

//attach popups to the features
marker.bindPopup("<strong>Hello world!</strong><br />I am a popup.").openPopup();
circle.bindPopup("Hello, I am a circle, have a circletastic day");
polygon.bindPopup("I am a polygon, have a polytastic day, yipiee!");

//create a standalone at a given location
var popup = L.popup()
    .setLatLng([51.5, -0.09])
    .setContent("I am a standalone popup, have a poppy day!")
    .openOn(map);

//create a popup ojbect that will be reused if someone clicks on the map
var popup = L.popup();

//function that will run anytime someone clicks on the map and makes use of popup variable
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

//look for clicks on map and run the onMapClick function when the map is clicked
map.on('click', onMapClick);