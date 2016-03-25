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
        lastUpdated: null
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
        lastUpdated: null
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
        lastUpdated: null
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
        lastUpdated: null
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
        lastUpdated: null
    }];

var Place = function(placeData) {
    this.name = ko.observable(placeData.name);
    this.url = ko.observable(placeData.url);
    this.address = ko.observable(placeData.address);
    this.phone = ko.observable(placeData.phone);
    this.image = ko.observable(placeData.imagesSrc);
    this.ratingScr = ko.observable(placeData.ratingSrc);
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
    //var currentPlace;

    self.placeInfoApiCall = function(clickedPlace) {
        var url = 'https://25j4uf5g5h.execute-api.us-west-2.amazonaws.com/active?business_id=' + clickedPlace.businessId();

        $.getJSON(url, function(data){
            console.log(data);
        }).error(function(){
            console.log('Request failed');
        });
    },

    self.setPlace = function(clickedPlace) {

        // self.currentPlace = new Place(clickedPlace);
        self.currentPlace(clickedPlace);
    },

    self.fillPlaceValues = function(place, data) {
        place.url = data.mobile_url;
        place.address = data.location.address[0];
        place.phone = data.display_phone;
        place.imagesSrc = data.image_url;
        place.ratingSrc = data.rating_img_url;
        place.categories = data.categories;
        place.lastUpdated = new Date();
    }
};
var viewModel = new ViewModel()
ko.applyBindings(viewModel);

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

    for (placeIndx in initialPlaces) {
        var place = initialPlaces[placeIndx]
        var placeName = place.name;
        var businessId = place.businessId.substr(0);
        var request = {
            location: boulder,
            radius: '3000',
            name: placeName
        };

        searchAndCreateMapMarker(request, place);
    };
};

function placeClicked(place) {
    if (place.lastUpdated === null
        || Math.floor((Math.abs(new Date().getTime() - place.lastUpdated)/1000)/60) > 15) {
        // Call the API for info
        var url = 'https://25j4uf5g5h.execute-api.us-west-2.amazonaws.com/active?business_id=' + place.businessId;

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
        // content: $("#infoWindow").clone()[0]
        content: $('#infoWindow').html()
    });

    console.log($('#infoWindow'));

    // infoWindow.setContent();
    // content = infoWindow.content;
    // console.log(content);

    // Open info window
    infoWindow.open(map, place.marker);
}

function createMapMarker(searchResults, place) {
    // Only take first result
    var searchResult = searchResults[0];

    // The next lines save location data from the search result object to local variables
    var lat = searchResult.geometry.location.lat(); // latitude from the place service
    var lon = searchResult.geometry.location.lng(); // longitude from the place service
    var name = searchResult.name; // name of the place from the place service
    var bounds = window.mapBounds; // current boundaries of the map window

    // marker is an object with additional data about the pin for a single location
    var marker = new google.maps.Marker({
        map: map,
        position: searchResult.geometry.location,
        title: name,
        place: place
    });

    place.marker = marker;

    // infoWindows are the little helper windows that open when you click
    // or hover over a pin on a map. They usually contain more information
    // about a location.

    boundPlaceClicked = placeClicked.bind(null, place);

    // hmmmm, I wonder what this is about...
    google.maps.event.addListener(marker, 'click', boundPlaceClicked);

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

// var infoWindow = {
//     init: function() {
//         this.
//         info.setAttribute("id", "infoWindow");
//         $infoWindow = $.("#infoWindow");
//         layer.innerText="Click to hide!";
//         $(layer).click(function(){ $(layer).hide('slow'); } );
//     },

//         infoWindow.setContent(layer); //something like this
// }
