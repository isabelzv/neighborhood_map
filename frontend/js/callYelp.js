var getYelpInfo = function() {
	for (place in initialPlaces) {
		var place = initialPlaces[place];
		var businessId = place.businessId;

		var url = 'https://25j4uf5g5h.execute-api.us-west-2.amazonaws.com/active?business_id=' + businessId;

        $.getJSON(url, function(data){
            place.url = data.mobile_url;
        	place.address = location.address;
        	place.phone = data.phone;
        	place.imagesSrc = data.image_url;
        	place.ratingSrc: = data.rating_img_url;
        	place.categories = data.categories[0];
            console.log(data);
        }).error(function(){
            console.log('Request failed');
        });
    };
};