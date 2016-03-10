function nonce_generate() {
  return (Math.floor(Math.random() * 1e12).toString());
}

var yelp_url = 'https://api.yelp.com/v2/search?';

  var parameters = {
    term: 'food',
    location: 'chicago',
    oauth_consumer_key: 'oYbkPiFsAc7uJITQv7EuEQ',
    oauth_token: 'cd38L3aEEj0mKLp8Q_0bD8W4O7crC-GZ',
    oauth_nonce: nonce_generate(),
    oauth_timestamp: Math.floor(Date.now()/1000),
    oauth_signature_method: 'HMAC-SHA1',
    callback: 'cb'             // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
  };

  var consumer_secret = 'NVpWNNWvxOEvCjWo7Wpe5aTDHiI',
      token_secret = 'jK0gheXsI4ZZyqK2ifovSktoAdY';

  var encodedSignature = oauthSignature.generate('GET',yelp_url, parameters, consumer_secret, token_secret);
  parameters.oauth_signature = encodedSignature;

  var settings = {
    url: yelp_url,
    data: parameters,
    cache: true,                // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
    dataType: 'jsonp',
    jsonpCallback: 'cb',
    success: function(results) {
      // Do stuff with results
      console.log("SUCCCESS! %o", results);
    },
    error: function(error) {
      // Do stuff on fail
      console.log(error);
    }
  };

// Send AJAX query via jQuery library.
$.ajax(settings);
//Sign up for free