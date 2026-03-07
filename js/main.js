/*Modified code from using geojson with leaflet tutorials/geog575 github
Written by Nolan Hegge 2/19/26
This code is meant to read in data from CO2 emissions from energy production from 1960-2023 across each US State
Data found is complied in states_cleaned_final.csv and states_cleaned_final.geojson
Data sources: https://www.eia.gov/environment/emissions/state  and  https://developers.google.com/public-data/docs/canonical/states_csv
*/

//declare map variable globally so all functions have access
var map;
var dataStats = {};

//create the map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [39.5, -98.35],
        zoom: 4
    });

    //add OSM base tilelayer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    //call the getData function
    getData(map);
};

//import the GeoJSON data
function getData(map){
    //load the data
    fetch("data/states_cleaned_final.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //calculate data statistics
            calcStats(json);
            //create an attributes array
            var attributes = processData(json);
            //call function to create proportional symbols
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
            createLegend(attributes);
            createFilterControl(attributes);
        })
};

//calculate min, max, and mean statistics across all states and years
function calcStats(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each state
    for(var state of data.features){
        //loop through each year
        for(var year = 1960; year <= 2023; year++){
            //get co2 for current year
            var value = state.properties["co2_" + String(year)];
            //add value to array
            allValues.push(value);
        }
    }
    //get min, max, mean stats for our array
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);
    //calculate mean value
    var sum = allValues.reduce(function(a, b){ return a + b; });
    dataStats.mean = sum / allValues.length;
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 2;
    //Flannery Apperance Compensation formula - https://gis.stackexchange.com/questions/444922/creating-proportional-symbols-with-leaflet
    var radius = 1.0083 * Math.pow(attValue/dataStats.min,0.5715) * minRadius

    return radius;
};

//function to build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with co2 values
        if (attribute.indexOf("co2_") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};

//build popup content string for a given feature and attribute
function createPopupContent(properties, attribute){
    //add state to popup content string
    var popupContent = "<p><b>State:</b> " + properties.fullName + " (" + properties.state_abr + ")</p>";

    //add formatted attribute to popup content string
    var year = attribute.split("_")[1];
    popupContent += "<p><b>CO2 Emissions in " + year + ":</b> " + properties[attribute] + " million metric tons</p>";

    return popupContent;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];

    //create marker options
    var options = {
        fillColor: "#e5383b",
        color: "#0b090a",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = createPopupContent(feature.properties, attribute);

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius)
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//add circle markers for the point features to the map
function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//function to add the sequence controls to change the year
function createSequenceControls(attributes){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function(){
            //create the control container with 'sequence-control-container' as the name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //add year label - start on 1960 as a "base year" so that users can see changes as time progresses, I also felt like this makes
            //sense since my data only goes up to 2023 so "current year" dosen't apply to this map.
            container.insertAdjacentHTML('beforeend', '<p id="year-label">Selected Year: <span id="selected-year">1960</span></p>');

            //create a range input slider
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">');

            //add step buttons (using buttons from activity 6 still)
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/reverse.png"></button>');
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/forward.png"></button>');

            //disable any mouse event listeners so that map dosen't freak out while using the slider
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());

    //set up the slider attributes
    document.querySelector(".range-slider").max = attributes.length - 1; //2023
    document.querySelector(".range-slider").min = 0; //1960
    document.querySelector(".range-slider").value = 0; //start at 1960
    document.querySelector(".range-slider").step = 1; //increase by 1 year

    //create a click listener for the buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;

            //increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //if past the last attribute, wrap around back to the first attribute
                index = index > attributes.length - 1 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //if past the first attribute, wrap around back to last attribute
                index = index < 0 ? attributes.length - 1 : index;
            };

            //update the slider as well when button is clicked
            document.querySelector('.range-slider').value = index;

            //update the proporitonal symbols to the current year
            updatePropSymbols(attributes[index]);

            //update the "current-year"
            document.querySelector("#selected-year").innerHTML = attributes[index].split("_")[1];
        })
    });

    //input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        //get the new index value
        var index = this.value;

        //pass new attribute to update symbols
        updatePropSymbols(attributes[index]);

        //update the "current-year"
        document.querySelector("#selected-year").innerHTML = attributes[index].split("_")[1];
    });
};

//function to resize the proportional symbols according to the yearly carbon emissions
function updatePropSymbols(attribute){
    //get the current filter threshold so it stays applied when the year is changed
    var filterSlider = document.querySelector('.filter-slider');
    var threshold = filterSlider ? Number(filterSlider.value) : 0;

    //go through map layesr
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //get the feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on current years carbon emissions
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //reapply filter so hidden circles stay hidden after year changes
            if (props[attribute] < threshold){
                layer.setStyle({ opacity: 0, fillOpacity: 0 });
            } else {
                layer.setStyle({ opacity: 1, fillOpacity: 0.8 });
            };

            //update the popup content as well
            var popupContent = createPopupContent(props, attribute);
            popup = layer.getPopup();
            popup.setContent(popupContent).update();
        };
    });
};

//function to create the legend
function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            //put in bottom right corner away from slider
            position: 'bottomright'
        },

        onAdd: function(){
            //create the control container named 'legend-control-container'
            var container = L.DomUtil.create('div', 'legend-control-container');

            //add the title for the legend - orignally tracked the year but took it out as I felt it was repetative (rip 30 mins)
            container.insertAdjacentHTML('beforeend', '<p class="legendTitle">CO<sub>2</sub> Emissions Scale</p>');

            //start the attribute legend svg string
            var svg = '<svg id="attribute-legend" width="220px" height="130px">';

            //array of representative values for legend protrinal symbol sizes (originally used min/max/mean but it looked quite gross so I chose
            //to make it just values that overall represent the range of the data while being easy to rad.)
            var circles = [500, 200, 50];

            //loop to add each circle and text to svg string
            for (var i = 0; i < circles.length; i++){

                //assign the r and cy attributes
                var radius = calcPropRadius(circles[i]);
                var cy = 125 - radius;

                //circle string
                svg += '<circle class="legend-circle" id="legend-' + circles[i] +
                '" r="' + radius + '" cy="' + cy + '" fill="#e5383b" fill-opacity="0.8" stroke="#0b090a" cx="35"/>';

                //make sure text is aligned top and far right of circle otherwise it was looked very crowded
                var textY = cy - radius + 4;

                //text string
                svg += '<text id="legend-' + circles[i] + '-text" x="105" y="' + textY + '">' + circles[i] + ' mil. mt</text>';
            };

            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            container.insertAdjacentHTML('beforeend', svg);

            return container;
        }
    });

    map.addControl(new LegendControl());
};

//function to add a filter control that hides states below set minimum emissions threshold
function createFilterControl(attributes){
    var FilterControl = L.Control.extend({
        options: {
            //put in top right so it doesn't overlap other controls
            position: 'topright'
        },

        onAdd: function(){
            //create the control container named 'filter-control-container'
            var container = L.DomUtil.create('div', 'filter-control-container');

            //add filter title and threshold display label
            container.insertAdjacentHTML('beforeend', '<p class="filterTitle">Filter by Minimum CO<sub>2</sub> Emissions</p>');
            container.insertAdjacentHTML('beforeend', '<p id="filter-label">Showing: <span id="filter-value">0</span>+ mil. mt</p>');

            //add the filter slider (range from 0 to 500 in steps of 10)
            container.insertAdjacentHTML('beforeend', '<input class="filter-slider" type="range" min="0" max="500" step="10" value="0">');

            //disable map mouse events on this container so it doesn't mess up inputs
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new FilterControl());

    //track current year so filter can use the right attribute
    var currentAttribute = attributes[0];

    //update currentAttribute when the time sqence slider changes
    document.querySelector('.range-slider').addEventListener('input', function(){
        currentAttribute = attributes[this.value];
    });

    //listen for the filter slider input
    document.querySelector('.filter-slider').addEventListener('input', function(){
        //get the threshold value from the filter slider
        var threshold = Number(this.value);

        //update the displayed threshold value
        document.querySelector('#filter-value').innerHTML = threshold;

        //show or hide each state circle based on threshold
        updateFilter(currentAttribute, threshold);
    });
};

//function to show/hide circles based on the emissions filter threshold
function updateFilter(attribute, threshold){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            var value = layer.feature.properties[attribute];

            //hide circle if below threshold, show if above
            if (value < threshold){
                layer.setStyle({ opacity: 0, fillOpacity: 0 });
            } else {
                layer.setStyle({ opacity: 1, fillOpacity: 0.8 });
            };
        };
    });
};

document.addEventListener('DOMContentLoaded',createMap)