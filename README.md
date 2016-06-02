# Neighborhood Map 
========================
Web application providing locations and information about places of interest in my neighborhood using Knockout and APIs.

## Getting Started

* Download or clone all of the files in the Github repo.
* In terminal navigate to dist directory and run "python -m SimpleHTTPServer 8000".
* Open browser and navigate to "http://localhost:8000".
* In order to not expose Yelp credentials there is a small backend service that propagates Yelp API requests to Yelp.com.
  It is implemented using Amazon API Gateway and Amazon Lambda sevices. 
