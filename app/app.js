'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');

const config = {
    logging: true,
};

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

function formatDate(date, hour) {
    var dateString = date + "T";
    let abbreviationStrings = []
}

module.exports.app = app;
