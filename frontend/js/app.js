// var package = require('oauth-signature');

initialPlaces = [
    {
        name: "Boulder Post Office",
        url: "",
        address: "Boulder Post Office",
        phone: "",
        imagesSrc: "",
        ratingSrc: "",
        categories: [],
        search: ["post office"],
        businessId: "us-post-office-boulder-5",
        lastUpdated: null,
        marker: null,
        isVisible: false,
        index: 0
    },
    {
        name: "Spruce Confections",
        url: "",
        address: "Spruce Confections",
        phone: "",
        imagesSrc: "",
        ratingSrc: "",
        categories: [],
        search: ["cafe", "food", "coffee shop"],
        businessId: "spruce-confections-boulder-2",
        lastUpdated: null,
        marker: null,
        isVisible: false,
        index: 1
    },
    {
        name: "The Kitchen",
        url: "",
        address: "1039 Pearl St, Boulder, CO 80302",
        phone: "",
        imagesSrc: "",
        ratingSrc: "",
        categories: [],
        search: ["restaurant, food"],
        businessId: "the-kitchen-next-door-boulder-3",
        lastUpdated: null,
        marker: null,
        isVisible: false,
        index: 2
    },
    {
        name: "Eben G. Fine Park",
        url: "",
        address: "Eben G. Fine Park",
        phone: "",
        imagesSrc: "",
        ratingSrc: "",
        categories: [],
        search: ["park", "playground", "picnic"],
        businessId: "eben-fine-park-boulder",
        lastUpdated: null,
        marker: null,
        isVisible: false,
        index: 3
    },
    {
        name: "Thrive",
        url: "",
        address: "1509 Arapahoe Ave, Boulder, CO 80302",
        phone: "",
        imagesSrc: "",
        ratingSrc: "",
        categories: [],
        search: [],
        businessId: "thrive-boulder",
        lastUpdated: null,
        marker: null,
        isVisible: false,
        index: 4
    }];

var Place = function(placeData) {
    var self = this;

    this.name = ko.observable(placeData.name);
    this.businessId = ko.observable(placeData.businessId);
    this.url = ko.observable(placeData.url);
    this.address = ko.observable(placeData.address);
    this.phone = ko.observable(placeData.phone);
    this.image = ko.observable(placeData.imagesSrc);
    this.ratingScr = ko.observable(placeData.ratingSrc);
    this.initialPlacesIndex = ko.observable(placeData.index);
    this.lastUpdated = ko.observable(placeData.lastUpdated);
    this.marker = ko.observable(placeData.marker);
    this.isVisible = ko.observable(false);

    // this.categories = ko.observableArray(placeData.categories);
    // this.search = ko.observableArray(placeData.search);
    // this.businessId = ko.observable(placeData.businessId);
};

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
        place.url(data.mobile_url);
        place.address(data.location.address[0]);
        place.phone(data.display_phone);
        place.image(data.image_url);
        // place.ratingSrc(data.rating_img_url);
        // place.categories(data.categories);
        place.lastUpdated(new Date());
    },

    // helper function to get the initialPlaces item from the KOobservable.
    self.getPlaceItem = function(koPlace) {
        viewModel.setPlace(koPlace);

        var index = self.currentPlace().initialPlacesIndex();
        var placeItem = initialPlaces[index];
        console.log(placeItem);

        viewModel.placeClicked(placeItem);
    }

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
                    // infoWindow.content = data;
                    console.log("success" + data);
                    // fill or update values of the place object
                    viewModel.fillPlaceValues(place, data);
                    viewModel.setPlace(place)
                },
                async: false,
                error: function(){
                    console.log('Request failed');
                }
            });
        } else {
            viewModel.setPlace(place);
        };

        var infoWindow = new google.maps.InfoWindow({
            content: $('#infoWindow').html()
        });

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



var map;
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
        console.log(placeName);
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
    boundPlaceClicked = viewModel.placeClicked.bind(null, place);

    // on click call placeClicked, which has been bound to the place object
    // that was used to build that marker.
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

