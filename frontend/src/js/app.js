// Hint JsHint to ignore these variables which are included in html
/*global ko*/
/*global google*/
/*global console*/
/*global window*/
/*global document*/
/*global $*/
/*global setTimeout*/

// declare gloabal variables
var map;
var infoWindow;
var service;

// essential initial place info.
var initialPlaces = [
    {
        name: "Boulder Post Office",
        businessId: "us-post-office-boulder-5"
    },
    {
        name: "Spruce Confections",
        businessId: "spruce-confections-boulder-2"
    },
    {
        name: "The Kitchen",
        businessId: "the-kitchen-next-door-boulder-3"
    },
    {
        name: "Eben G. Fine Park",
        businessId: "eben-fine-park-boulder"
    },
    {
        name: "Thrive",
        businessId: "thrive-boulder"
    }];

// create ko.object with the initial place and empty fields.
// empty feilds neccessary for #infoWindow bindings
var Place = function(placeData) {
   'use strict';

    this.name = ko.observable(placeData.name);
    this.businessId = ko.observable(placeData.businessId);
    this.url = ko.observable(null);
    this.address = ko.observable(null);
    this.phone = ko.observable(null);
    this.image = ko.observable(null);
    this.lastUpdated = ko.observable(null);
    this.marker = ko.observable(null);
    this.isVisible = ko.observable(true);
};

var ViewModel = function() {
   'use strict';

    var self = this;

    // create observableArray of places.
    self.placeList = ko.observableArray([]);

    // create a new ko Observable for each place and push it into
    // placeList observableArray.
    initialPlaces.forEach(function(placeItem) {
        self.placeList.push(new Place(placeItem));
    });

    // create observaleArray of places with visible markers and li.
    self.visiblePlaces = ko.observableArray();

    // push all place objects into visiblePlaces to start.
    initialPlaces.forEach(function(place) {
        self.visiblePlaces.push(place);
    });

    // obsevable to show list of places or hide behind hamburger.
    self.placeListVisible = ko.observable(false);

    // observable for logging error messages to the UI.
    self.placeErrorMessage = ko.observable('');

    // function to toggle placeList visible/hidden.
    self.togglePlaceList = function() {
        self.placeListVisible(!self.placeListVisible());
        console.log(self.placeListVisible());
    },

    // helper function for placeClicked
    // take data from the API response and use it to fill in place objects fields.
    self.fillPlaceValues = function(place, data) {
        place.url(self.makeDisplayUrl(data.mobile_url));
        place.address(data.location.address[0]);
        place.phone(data.display_phone);
        place.image(data.image_url);

        // create a new time for last updated.
        // used to check if cache needs refreshing.
        place.lastUpdated(new Date());
    },

    // helper function for fillPlaceValues to shorten response url
    self.makeDisplayUrl = function(url) {
        var endIndex = url.indexOf('?');
        return url.substr(0, endIndex);
    },

    self.setInfoWindowContent = function(name, address, phone, url, imageSrc) {
        // declare variables
        var nameElem = '';
        var addressElem = '';
        var phoneElem = '';
        var urlElem = '';
        var imageElem = '';

        // define html for elements based on whether parameter is valid
        if (name) {
            nameElem = '<h1 class="infoName">' + name + '</h1>';}
        if (address) {
            addressElem = '<li>' + address + '</li>';}
        if (phone) {
            phoneElem = '<li>' + phone + '</li>';}
        if (url) {
            urlElem = '<a href=' + url + '>Website</a>';}
        if (imageSrc) {
            imageElem = '<img class="img-center" src="' + imageSrc + '"alt="image of place"></img>';}

        // set content of infoWindow using html
        infoWindow.setContent('<div class="infoWindow">' +
        nameElem +
        '<div class="row">' +
        '<div class="col-xs-6">' +
        '<ul>' + addressElem + phoneElem + urlElem + '</ul>' +
        '</div>' +
        '<div class="col-xs-4">' + imageElem + '</div>' +
        '</div>' +
        '</div>');
    },

    // main function to call API, fill in place info and open info window
    self.placeClicked = function(place) {
        // Set content of infoWindow to "Loading" and open at marker
        infoWindow.setContent('Loading...');
        infoWindow.open(map, place.marker());

        // check if the API was updated less than 15 minutes ago.
        if (place.lastUpdated() === null || Math.floor((Math.abs(new Date().getTime() - place.lastUpdated())/1000)/60) > 15) {
            // Call the API for info
            var url = 'https://25j4uf5g5h.execute-api.us-west-2.amazonaws.com/active?business_id=' + place.businessId();

            // reset lastUpdated
            place.lastUpdated(new Date());

            $.ajax({
                type: 'GET',
                url: url,
                dataType: 'json',
                success: function(data){
                    console.log("data = ", data);
                    // pass data values into helper function to set infoWindow content
                    self.setInfoWindowContent(data.name, data.location.address[0], data.display_phone, data.url, data.image_url);

                    // center the map on the marker
                    offsetCenter(place.marker().getPosition(),0,-150);

                    // bounce marker
                    self.markerBounce(place.marker());

                    // fill place object with values for next use, so another ajax call doesn't have to be made
                    self.fillPlaceValues(place, data);
                }
            }).error(function(){
                // set content of infoWindow to display error message.
                // I kept this error handling like this rather than using a text binding, because I couldn't work out how
                // to bind into the infoWindow without creating an infoWindow elem offscreen and then loading that content
                // into the infoWindow using js, which I was told specifically not to do in the previous review.
                infoWindow.setContent("Oops something went wrong :( Yelp info failed to load, please try later.");
            });} else {
            // call helper function to set infoWindow content
            self.setInfoWindowContent(place.name(), place.address(), place.phone(), place.url(), place.image());
            }
    },

    // create ko.observable bound with search bar.
    self.userInput = ko.observable(''); // jshint ignore:line

    // http://stackoverflow.com/questions/29557938/removing-map-pin-with-search
    self.filterMarkers = ko.computed(function() {
        var searchInput = self.userInput().toLowerCase();

        // return a filtered version of the placeList observibleArray with only
        // places where names match userInput
        return ko.utils.arrayFilter(self.placeList(), function (place) {
            // boolean depending on whether string is found in place name
            var doesMatch = place.name().toLowerCase().indexOf(searchInput) >= 0;

            // sets isVisible to true or false depending on whether match is found
            place.isVisible(doesMatch);

            return doesMatch;
        });
    });

    // bounce marker twice
    self.markerBounce = function(marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        // time it takes to bounce marker twice.
        setTimeout(function(){ marker.setAnimation(null); }, 1400);
    };
};

// create new ViewModel
var viewModel = new ViewModel();


function searchAndCreateMapMarker(request, place) {
    'use strict';

    // use our service(boulder) map to do a search for placeName(request).
    service.nearbySearch(request, function(result, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {

            createMapMarker(result, place);
        } else {
            // display error message when Google Places API fails
            viewModel.placeErrorMessage("sorry, Google Places failed to return information on one or more places...");
        }
    });
}

// helper function to offset center of map when marker is clicked to avoid overlap of infowindow and title/search
// http://stackoverflow.com/questions/10656743/how-to-offset-the-center-point-in-google-maps-api-v3
function offsetCenter(latlng, offsetx, offsety) {
   'use strict';

    var scale = Math.pow(2, map.getZoom());

    var worldCoordinateCenter = map.getProjection().fromLatLngToPoint(latlng);
    var pixelOffset = new google.maps.Point((offsetx/scale) || 0,(offsety/scale) ||0);

    var worldCoordinateNewCenter = new google.maps.Point(
        worldCoordinateCenter.x - pixelOffset.x,
        worldCoordinateCenter.y + pixelOffset.y
    );

    var newCenter = map.getProjection().fromPointToLatLng(worldCoordinateNewCenter);

    map.setCenter(newCenter);

}

// function called from html via Google Maps callback, once map has loaded
function initMap() {
   'use strict';

    // define center of map
    var boulder = new google.maps.LatLng(40.0274, -105.2519);

    // tell map where to go on page, where to center on (boulder) and zoom level
    map = new google.maps.Map(document.getElementById('map'), {
        center: boulder,
        zoom: 15
    });

    // create a new map.
    service = new google.maps.places.PlacesService(map);

    // add event listener that will close infowindow when map is clicked
    google.maps.event.addListener(map, "click", function(event) {
        infoWindow.close();
    });

    // add event listener to close list of places (if open) on map click.
    google.maps.event.addListener(map, "click", function(event) {
        if (viewModel.placeListVisible() === true) {
            viewModel.placeListVisible(false);
        }
    });

    // create a marker for each place in placeList.
    viewModel.placeList().forEach(function(place) {
        var placeName = place.name();
        // store businessId as part of marker to use in API call when marker clicked.
        var businessId = place.businessId().substr(0);
        // create request to pass into searchAndCreateMapMarker function.
        var request = {
            location: boulder,
            radius: '4000',
            name: placeName
        };

        searchAndCreateMapMarker(request, place);
    });

    // Sets the boundaries of the map based on pin locations
    window.mapBounds = new google.maps.LatLngBounds();

    // create a single infoWindow object.
    infoWindow = new google.maps.InfoWindow({
        maxWidth: 250
    });

    // apply ko bindings after map has been initialized
    ko.applyBindings(viewModel);
}

function createMapMarker(searchResults, place) {
   'use strict';

    // Only take first result
    var searchResult = searchResults[0];

    // The next lines save location data from the search result object to local variables
    var latitude = searchResult.geometry.location.lat(), // latitude from the place service
        longitude = searchResult.geometry.location.lng(), // longitude from the place service
        location = {lat: latitude, lng: longitude},
        name = searchResult.name, // name of the place from the place service
        bounds = window.mapBounds; // current boundaries of the map window

    // marker is an object with additional data about the pin for a single location
    var marker = new google.maps.Marker({
        map: map,
        position: location,
        title: name,
    });

    // Add marker info to place so that infowindow can open on li click
    place.marker(marker);

    // function to filter markers according to search.
    // http://stackoverflow.com/questions/29557938/removing-map-pin-with-search Janfoeh.
    place.isVisible.subscribe(function(currentState) {
        if (currentState) {
          place.marker().setVisible(true);
        } else {
          place.marker().setVisible(false);
        }
    });

    place.isVisible(true);

    // add event listener to marker, which calls placeClicked with the place linked to that
    // marker as the parameter.
    google.maps.event.addListener(marker, 'click', viewModel.placeClicked.bind(null, place));

    // this is where the pin actually gets added to the map.
    // bounds.extend() takes in a map location object
    bounds.extend(new google.maps.LatLng(latitude, longitude));
    // fit the map to the new marker
    map.fitBounds(bounds);
    // center the map
    map.setCenter(bounds.getCenter());

    // set map to resize to new bounds when window is resized
    window.onresize = function() {
        map.fitBounds(bounds); // `bounds` is a `LatLngBounds` object
    };
}

// function to be called if Google Maps api doesn't load.
function googleError(event) {
    'use strict';
    window.alert('Google Map failed to load. Please try reloading the page.');
}
