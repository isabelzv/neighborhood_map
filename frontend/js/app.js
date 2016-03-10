// var package = require('oauth-signature');

var initialPlaces = [
    {
        name: "Boulder Post Office",
        url: "",
        address: "Boulder post office",
        search: ["post office"],
        businessId: "post-office-boulder"
    },
    {
        name: "Spruce Confections",
        url: "",
        address: "Spruce Confections",
        search: ["cafe", "food", "coffee shop"],
        businessId: "spruce-boulder"
    },
    {
        name: "The Kitchen",
        url: "",
        address: "1039 Pearl St, Boulder, CO 80302",
        search: ["restaurant, food"],
        businessId: "kitchen"
    },
    {
        name: "Eben G. Fine Park",
        url: "",
        address: "Eben G. Fine Park",
        search: ["park", "playground", "picnic"],
        businessId: "fine-park"
    },
    {
        name: "Thrive",
        url: "",
        address: "1509 Arapahoe Ave, Boulder, CO 80302",
        search: "",
        businessId: "thrive-boulder"
    }];

var Place = function(placeData) {
    this.name = ko.observable(placeData.name);
    this.url = ko.observable(placeData.url);
    this.address = ko.observable(placeData.address);
    this.search = ko.observableArray(placeData.search);
    this.businessId = ko.observable(placeData.businessId);
};

var ViewModel = function() {
    var self = this;

    self.placeList = ko.observableArray([]);

    initialPlaces.forEach(function(placeItem) {
        self.placeList.push(new Place(placeItem));
    });

    self.currentPlace = ko.observable(self.placeList()[0]);

    self.placeInfoApiCall = function(clickedPlace) {
        var url = 'https://25j4uf5g5h.execute-api.us-west-2.amazonaws.com/active?business_id=' + clickedPlace.businessId();

        $.getJSON(url, function(data){
            console.log(data);
        }).error(function(){
            console.log('Request failed');
        });
    };

    self.setPlace = function(clickedPlace) {
        self.currentPlace(clickedPlace);
        self.placeInfoApiCall(clickedPlace);
    };
};

ko.applyBindings(new ViewModel());

// var ViewModel = function() {
//     var self = this;

//     self.catList = ko.observableArray([]);

//     initialCats.forEach(function(catItem) {
//         self.catList.push(new Cat(catItem) );
//     });

//     self.currentCat = ko.observable( self.catList()[0] );

//     self.incrementCounter = function() {
//         self.currentCat().clickCount(self.currentCat().clickCount() + 1);
//     };

//     self.setCat = function(clickedCat) {
//         self.currentCat(clickedCat);
//     };
// };

var map;
var service;
var infowindow;

function initialize() {
    var boulder = new google.maps.LatLng(40.0274, -105.2519);

    map = new google.maps.Map(document.getElementById('map'), {
        center: boulder,
        zoom: 15
    });

    service = new google.maps.places.PlacesService(map);

    for (placeIndx in initialPlaces) {
        var place = initialPlaces[placeIndx]
        var placeName = place.name;
        var businessId = place.businessId.substr(0);
        var request = {
            location: boulder,
            radius: '3000',
            name: placeName
        };

        service.nearbySearch(request, function(result, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                createMapMarker(result, businessId);
            }
        });
    };
};

function createMapMarker(searchResults, businessId) {
    // Only take first result
    var searchResult = searchResults[0];

    // The next lines save location data from the search result object to local variables
    var lat = searchResult.geometry.location.lat(); // latitude from the place service
    var lon = searchResult.geometry.location.lng(); // longitude from the place service
    var name = searchResult.formatted_address; // name of the place from the place service
    var bounds = window.mapBounds; // current boundaries of the map window

    // marker is an object with additional data about the pin for a single location
    var marker = new google.maps.Marker({
        map: map,
        position: searchResult.geometry.location,
        title: name,
        businessId: businessId
    });

    // infoWindows are the little helper windows that open when you click
    // or hover over a pin on a map. They usually contain more information
    // about a location.
    var infoWindow = new google.maps.InfoWindow({
        content: businessId
    });

    // hmmmm, I wonder what this is about...
    google.maps.event.addListener(marker, 'click', function() {
        // Call the API for info
        var url = 'https://25j4uf5g5h.execute-api.us-west-2.amazonaws.com/active?business_id=' + marker.businessId;

        $.getJSON(url, function(data){
            infoWindow.content = data;
        }).error(function(){
            console.log('Request failed');
        });        // Set info window data
        // ...
        // Open info window
        infoWindow.open(map, marker);
    });

    // // this is where the pin actually gets added to the map.
    // // bounds.extend() takes in a map location object
    // bounds.extend(new google.maps.LatLng(lat, lon));
    // // fit the map to the new marker
    // map.fitBounds(bounds);
    // // center the map
    // map.setCenter(bounds.getCenter());
};

// Calls the initializeMap() function when the page loads
window.addEventListener('load', initialize);

// Vanilla JS way to listen for resizing of the window
// and adjust map bounds
// window.addEventListener('resize', function(e) {
//     //Make sure the map bounds get updated on page resize
//     map.fitBounds(mapBounds);
// });
