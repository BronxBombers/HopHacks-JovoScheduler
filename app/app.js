'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');
const awsSDK = require('aws-sdk');
const docClient = new awsSDK.DynamoDB.DocumentClient();

const config = {
    logging: true,
};
const app = new App(config);


// =================================================================================
// App Logic
// =================================================================================

app.setHandler({
    'LAUNCH': function() {
        const getBody = {
            TableName: "Businesses",
            Key: {
                businessID: 0
            }
        };
        
        docClient.get(getBody).promise().then((data) => {
            console.log(data);
            this.tell("hi");
        
        })
        .catch((err)=>{
            console.log(err);
            this.tell(err)});
    },

    'BookAllInfoProvided' : function(
        appointmentType, business, 
        location, date, time, staff) {

        /* let customerName = this.AlexaUser().getName()
            .then((name) => {
                return name;
            }).catch((error) => {
                if (error.code === 'NO_USER_PERMISSION') {
                    this.alexaSkill().showAskForContactPermissionCard('name')
                        .tell(`Please grant access to your full name.`);
                }
            })
        let customerEmail = this.AlexaUser().getEmail()
            .then((email) => {
                return email;
            }).catch((error) => {
            if (error.code === 'NO_USER_PERMISSION') {
                this.alexaSkill().showAskForContactPermissionCard('email')
                    .tell(`Please grant access to your email address.`);
            }
        let businessData = dynamo_read(business, location);
        let bookingAPIPayload = 
        `{
            "start_datetime":"",
            "service":"${appointmentType}",
            "customer_email":"${customerEmail}",

        }`
        this.ask("hello", "reprompt "); */
    },

    'HelloWorldIntent': function() {
        this.ask('Hello World! What\'s your name?', 'Please tell me your name.');
    },

    'MyNameIsIntent': function(name) {
        this.tell('Hey ' + name.value + ', nice to meet you!');
    },
});


module.exports.app = app;
