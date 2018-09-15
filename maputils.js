var googleMapsClient = require('@google/maps').createClient({
  key: "AIzaSyAk7Qs_YIL2TjYVz-7geYEfj7kLohXhKLI"
});

function get_places_from_type(curr_location, place_type) { 
    googleMapsClient.geocode({
        address: curr_location
    }, function(err, response) {
        if (!err) {
            console.log(response.json.results);
        }

    });
}




/*
var PLACE_AUTO = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input="
var ADDRESS_TO_LAT = "https://maps.googleapis.com/maps/api/geocode/json?address="
var input_type = "&inputtype="
var fields = "&fields="
var key = "&key="

function uuidv4() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

//curr_location = address -> coordinates = google geocoding api
//place_type = what kind of location are you looking for
function get_places_from_type(curr_location, place_type) {
    const HTTP = new XMLHttpRequest();
    var URL = ADDRESS_TO_LAT;
    //console.log(curr_location);  
       URL += key + API_KEY;
    //console.log(URL);
    HTTP.open("GET", URL);
    HTTP.send();
    HTTP.onreadystatechange=(e)=> {
        var json = JSON.parse(HTTP.responseText);
        //console.log(json); 
        coordinates = []; 
        coordinates.push(json["results"][0]["geometry"]["location"]["lat"]);
        coordinates.push(json["results"][0]["geometry"]["location"]["lng"]);
        return coordinates;
    }    
    console.log(coord);
}
*/
