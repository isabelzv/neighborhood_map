var oauthSignature = require('oauth-signature');
var request = require('request');

function nonce_generate() {
  return (Math.floor(Math.random() * 1e12).toString());
}

var consumer_secret = 'NVpWNNWvxOEvCjWo7Wpe5aTDHiI';
var token_secret = 'jK0gheXsI4ZZyqK2ifovSktoAdY';

exports.handler = function (event, context) {
  var yelp_url = 'https://api.yelp.com/v2/business/' + event.yelp_business_id;

  var parameters = {
    oauth_consumer_key: 'oYbkPiFsAc7uJITQv7EuEQ',
    oauth_token: 'cd38L3aEEj0mKLp8Q_0bD8W4O7crC-GZ',
    oauth_nonce: nonce_generate(),
    oauth_timestamp: Math.floor(Date.now()/1000),
    oauth_signature_method: 'HMAC-SHA1'
    // callback: 'cb'             // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
  };

  parameters.oauth_signature = oauthSignature.generate('GET', yelp_url, parameters, consumer_secret, token_secret);

  request({url:yelp_url, qs:parameters, json: true}, function(err, response, body) {
    if(err) {
      context.fail(err);
      return;
    }
    context.succeed(body);
    return;
  });
}
