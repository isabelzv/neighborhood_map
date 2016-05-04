
// grab infowindow elem for error handling purposes
var $infoWindowElem = $('#infoWindow');

var
initialPlaces = [
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

var Place = function(placeData) {
    var self = this;

    this.name = ko.observable(placeData.name);
    this.businessId = ko.observable(placeData.businessId);
    this.url = ko.observable(null);
    this.address = ko.observable(null);
    this.phone = ko.observable(null);
    this.image = ko.observable(null);
    this.lastUpdated = ko.observable(null);
    this.marker = ko.observable(null);
    this.isVisible = ko.observable(false);
};

var map;

var ViewModel = function() {
    var self = this;

    self.placeList = ko.observableArray([]);

    initialPlaces.forEach(function(placeItem) {
        self.placeList.push(new Place(placeItem));
    });

    self.currentPlace = ko.observable(self.placeList()[0]);

    self.visiblePlaces = ko.observableArray();

    initialPlaces.forEach(function(place) {
        self.visiblePlaces.push(place);
    });

    self.setPlace = function(clickedPlace) {

        // self.currentPlace = new Place(clickedPlace);
        self.currentPlace(clickedPlace);
    },

    self.fillPlaceValues = function(place, data) {
        place.url(self.makeDisplayUrl(data.mobile_url));
        place.address(data.location.address[0]);
        place.phone(data.display_phone);
        place.image(data.image_url);
        place.lastUpdated(new Date());
    },

    self.makeDisplayUrl = function(url) {
        var endIndex = url.indexOf('?');
        return url.substr(0, endIndex);
    };

    // helper function to get the initialPlaces item from the KOobservable.
    // self.getPlaceItem = function(koPlace) {
    //     viewModel.setPlace(koPlace);

    //     var index = self.currentPlace().initialPlacesIndex();
    //     var placeItem = initialPlaces[index];

    //     viewModel.placeClicked(placeItem);
    // },

    self.yelpRequestTimeout = function() {
        setTimeout(function(){
            //$infoWindowElem.text("Sorry, yelp info can't be displayed right now. Try again in a bit.");
            $infoWindowElem.text("");
            $infoWindowElem.text("yelp info can't be displayed right now");
        }, 8000);
    },

    self.placeClicked = function(place) {
        if (place.lastUpdated() === null
            || Math.floor((Math.abs(new Date().getTime() - place.lastUpdated())/1000)/60) > 15) {
            // Call the API for info
            var url = 'https://25j4uf5g5h.execute-api.us-west-2.amazonaws.com/active?business_id=' + place.businessId();

            $.ajax({
                type: 'GET',
                url: url,
                dataType: 'json',
                success: function(data){
                    // fill or update values of the place object
                    viewModel.fillPlaceValues(place, data);
                    viewModel.setPlace(place);
                    // clearTimeout(viewModel.yelpRequestTimeout);
                },
                async: false,
            }).error(function() {
                $infoWindowElem.text("oops, something went wrong. Yelp info can't be displayed right now. Try again later.");
            })
        } else {
            viewModel.setPlace(place);
        };

        var infoWindow = new google.maps.InfoWindow({
            content: $('#infoWindow').html(),
            maxWidth: 300
        });

        // center the map on the marker
        map.setCenter(place.marker().getPosition());

        // bounce marker
        self.markerBounce(place.marker());

        // Open info window
        infoWindow.open(map, place.marker());
    },

    self.userInput = ko.observable('');

    // http://stackoverflow.com/questions/29557938/removing-map-pin-with-search
    self.filterMarkers = ko.computed(function() {
        var searchInput = self.userInput().toLowerCase();
        console.log(searchInput);

        return ko.utils.arrayFilter(self.placeList(), function (place) {
            var doesMatch = place.name().toLowerCase().indexOf(searchInput) >= 0;

            place.isVisible(doesMatch);

            return doesMatch;
        });
    });

    self.markerBounce = function(marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){ marker.setAnimation(null); }, 1400);
    };
};

var viewModel = new ViewModel()
ko.applyBindings(viewModel);



var service;
var infowindow;
// var marker;

function searchAndCreateMapMarker(request, place) {
    service.nearbySearch(request, function(result, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            createMapMarker(result, place);
        }
    });
};

function initialize() {
    var boulder = new google.maps.LatLng(40.0274, -105.2519);

    map = new google.maps.Map(document.getElementById('map'), {
        center: boulder,
        zoom: 15
    });

    service = new google.maps.places.PlacesService(map);

    viewModel.placeList().forEach(function(place) {
        // var place = initialPlaces[placeIndx]
        var placeName = place.name();
        var businessId = place.businessId().substr(0);
        var request = {
            location: boulder,
            radius: '4000',
            name: placeName
        };

        searchAndCreateMapMarker(request, place);
    });

    // Sets the boundaries of the map based on pin locations
    window.mapBounds = new google.maps.LatLngBounds();
};

function createMapMarker(searchResults, place) {
    // Only take first result
    var self = this;
    var searchResult = searchResults[0];

    // The next lines save location data from the search result object to local variables
    var latitude = searchResult.geometry.location.lat(); // latitude from the place service
    var longitude = searchResult.geometry.location.lng(); // longitude from the place service
    var location = {lat: latitude, lng: longitude};
    var name = searchResult.name; // name of the place from the place service
    var bounds = window.mapBounds; // current boundaries of the map window

    // marker is an object with additional data about the pin for a single location
    var marker = new google.maps.Marker({
        map: map,
        position: location,
        title: name,
    });

    // bind the markerBounce function to the place parameter.
    // boundMarkerBounce = markerBounce.bind(null, marker);

    // marker.addListener('click', boundMarkerBounce);

    // Add marker info to place so that infowindow can open on li click
    place.marker(marker);

    // function to filter markers according to search.
    // http://stackoverflow.com/questions/29557938/removing-map-pin-with-search Janfoeh.
    place.isVisible.subscribe(function(currentState) {
        if (currentState) {
          place.marker().setMap(map);
        } else {
          place.marker().setMap(null);
        }
    });

    place.isVisible(true);


    // bind the placeClicked function to the place parameter.
    self.boundPlaceClicked = viewModel.placeClicked.bind(null, place);

    // on click call placeClicked, which has been bound to the place object
    // that was used to build that marker.
    // google.maps.event.addListener(marker, 'click', function(){
    //     boundPlaceClicked;
    //     map.setCenter(marker.getPosition());
    // });


    google.maps.event.addListener(marker, 'click', boundPlaceClicked);

    // this is where the pin actually gets added to the map.
    // bounds.extend() takes in a map location object
    bounds.extend(new google.maps.LatLng(latitude, longitude));
    // fit the map to the new marker
    map.fitBounds(bounds);
    // center the map
    map.setCenter(bounds.getCenter());
};


// Calls the initializeMap() function when the page loads
window.addEventListener('load', initialize);

// Vanilla JS way to listen for resizing of the window
// and adjust map bounds
// window.addEventListener('resize', function(e) {
//     //Make sure the map bounds get updated on page resize
//     map.fitBounds(mapBounds);
// });

// $('#searchBar').click(function() {
//    //optionally remove the 500 (which is time in milliseconds) of the
//    //scrolling animation to remove the animation and make it instant
//    $.scrollTo($('.searchBar'), 500);
// });

