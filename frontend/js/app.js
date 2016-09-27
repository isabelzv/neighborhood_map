
// declare gloabal variables
var map;
var infoWindow;


// grab infowindow elem for error handling purposes
var $infoWindowElem = $('#infoWindow');

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

var ViewModel = function() {
    var self = this;

    self.placeList = ko.observableArray([]);

    initialPlaces.forEach(function(placeItem) {
        self.placeList.push(new Place(placeItem));
    });

    self.currentPlace = ko.observable(self.placeList()[0]);

    // places that have visible markers and li
    self.visiblePlaces = ko.observableArray();

    // push all place objects into visible places to start.
    initialPlaces.forEach(function(place) {
        self.visiblePlaces.push(place);
    });

    // obsevable to hide list of places or hise behind hamburger
    self.placeListVisible = ko.observable(false);

    // function to toggle placeList
    self.togglePlaceList = function() {
        self.placeListVisible(!self.placeListVisible());
        console.log(self.placeListVisible());
    };

    // helper function for placeClicked
    // change place occupying infoWindow
    self.setPlace = function(clickedPlace) {
        self.currentPlace(clickedPlace);
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
    };

    // main function to call API, fill in place info and open info window
    self.placeClicked = function(place) {
        // check if the API was updated less than 15 minutes ago.
        if (place.lastUpdated() === null
            || Math.floor((Math.abs(new Date().getTime() - place.lastUpdated())/1000)/60) > 15) {
            // Call the API for info
            var url = 'https://25j4uf5g5h.execute-api.us-west-2.amazonaws.com/active?business_id=' + place.businessId();

            // var place = place;
            console.log("place = ", place);

            $.when($.ajax({
                type: 'GET',
                url: url,
                dataType: 'json'
                // success: function(data){
                // // fill or update values of the place object
                // viewModel.fillPlaceValues(place, data);
                // // populate #infoWindow with place clicked
                // viewModel.setPlace(place);
                // },
                // force ajax request to complete before moving on.
                // async: false,
            // handle error
            // }).error(function() {
                // $infoWindowElem.text("oops, something went wrong. Yelp info can't be displayed right now. Try again later.");
            })).done(function(data, place) {
                    console.log("data = ", data);
                    console.log("place = ", place);
                    // fill or update values of the place object
                    viewModel.fillPlaceValues(place, data);
                    // populate #infoWindow with place clicked
                    // viewModel.setPlace(place);
            })}; // else {
            // if no new API call is needed then just set #infoWindow to display the place clicked
            // viewModel.setPlace(place);
        // };

        // create a new infoWindow
        var infoWindow = new google.maps.InfoWindow({
            // set the content to html element with id infoWindow
            content: $('#infoWindow').html(),
            // set maxWidth to 300px (over riding 200px)
            maxWidth: 300
        });

        // center the map on the marker
        map.setCenter(place.marker().getPosition());

        // bounce marker
        self.markerBounce(place.marker());

        // Open info window
        infoWindow.open(map, place.marker());
    },

    // create ko.observable bound with search bar.
    self.userInput = ko.observable('');

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

            // console.log("place.marker = ", place.marker);
            // place.marker.setVisible(doesMatch);

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

var viewModel = new ViewModel()
ko.applyBindings(viewModel);



var service;
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
        // setVisible: true
    });

    // bind the markerBounce function to the place parameter.
    // boundMarkerBounce = markerBounce.bind(null, marker);

    // marker.addListener('click', boundMarkerBounce);

    // Add marker info to place so that infowindow can open on li click
    place.marker(marker);

    // function to filter markers according to search.
    // http://stackoverflow.com/questions/29557938/removing-map-pin-with-search Janfoeh.
    // place.isVisible.subscribe(function(currentState) {
    //     if (currentState) {
    //       place.marker().setMap(map);
    //     } else {
    //       place.marker().setMap(null);
    //     }
    // });

    // place.isVisible(true);


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

