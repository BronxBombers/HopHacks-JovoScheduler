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

    'BookAllInfoProvided' : function(
        appointmentType, business, 
        location, date, time) {
        let customerName = this.AlexaUser().getName();
        let customerEmail = this.AlexaUser().getEmail();
        let customerPhone = this.AlexaUser().getMobileNumber();
        let businessData = dynamo_read(business, location);
        let bookingAPIPayload = 
        `{
            "start_datetime":"",
            "service":"${appointmentType}",
            "customer_email":"${customerEmail}",

        }`
        this.ask("hello", "reprompt ");
    },

    'HelloWorldIntent': function() {
        this.ask('Hello World! What\'s your name?', 'Please tell me your name.');
    },

    'MyNameIsIntent': function(name) {
        this.tell('Hey ' + name.value + ', nice to meet you!');
    },
});

<<<<<<< HEAD
function formatDate(date, hour) {
    var dateString = date + "T";
    let abbreviationStrings = []
}
=======

>>>>>>> f0daf1b51bb10383a7ed32d33848e72ffd02b013

module.exports.app = app;
