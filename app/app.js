'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');

// Using the constructor
const config = {
    logging: true,
    db: {
        type: 'dynamodb',
        tableName: 'Businesses',
    },
};

// Using the setter
app.setDynamoDb('Businesses');
const app = new App(config);


// =================================================================================
// App Logic
// =================================================================================

app.setHandler({
    'LAUNCH': function() {
        this.toIntent('HelloWorldIntent');
    },

    //Handler for intent
    'BookAllInfoProvided' : function(
        appointmentType, business, 
        location, date, time, staff) {
        let customerName = this.AlexaUser().getName();
        let customerEmail = this.AlexaUser().getEmail();
        //let customerPhone = this.AlexaUser().getMobileNumber();
        let businessData = dynamo_read(business, location);
        //Create API call through this intent
        let xhttp = new XMLHttpRequest();
        xhttp.open("GET", "https://api.timekit.io/v2/resources", "false");
        xhttp.setRequestHeader("Authentication", "test_api_key_Nx576ghNNP5jnaZKGL8Z3vbqTCBxtdnE");
        xhttp.send();
        /*
        let bookingAPIPayload = 
        `{
            "start_datetime":"",
            "service":"${appointmentType}",
            "customer_email":"${customerEmail}",

        }`
        */
        this.ask("hello", "reprompt ");
    },

    'HelloWorldIntent': function() {
        this.ask('Hello World! What\'s your name?', 'Please tell me your name.');
    },

    'MyNameIsIntent': function(name) {
        this.tell('Hey ' + name.value + ', nice to meet you!');
    },
});

function formatDate(date, hour) {
    var dateString = date + "T";
    let abbreviationStrings = []
}



module.exports.app = app;
