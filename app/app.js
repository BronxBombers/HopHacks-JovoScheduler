'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');
const awsSDK = require('aws-sdk');
var moment = require('moment');
var request = require('request-promise');
var stringSimilarity = require('string-similarity');
var AWS = require('aws-sdk');
const docClient = new awsSDK.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

const config = {
    logging: true,
};
const app = new App(config);


// =================================================================================
// App Logic
// =================================================================================

app.setHandler({
    'LAUNCH': function() {
        this.followUpState('BookingType')
            .ask('Welcome to booking buddy. What would you like to book today?', 'I would like to know what appointment you would like to make.');
    },

    'BookingType' : {
        'bookingCatchAll' : function(bookingData) {
            return checkForKeyValue(bookingData.value, 'bookingType')
            .then((dbValue) => {
                console.log(dbValue);
                if (typeof dbValue === "string"){
                    this.addSessionAttribute('bookingType', dbValue);
                    this.followUpState('TimeAndDate')
                        .ask("When would you like to book your " + dbValue + "?",
                                "Please give me a time.");
                } else if (dbValue !== null) {
                    this.followUpState('TypeConfirmationState')
                        .ask("I'm sorry, I had a hard time understanding what you said. Did you mean to say " + dbValue.target + " ?",
                            "Say yes if that is what you meant, say no if it isn't.");
                } else {
                    this.followUpState('BookingType').ask("I'm sorry, I had some trouble processing what you said, can you please repeat yourself?",
                                "Please repeat yourself.");
                }
            })
        },
        'Unhandled' : function() {
            this.ask("I'm sorry I didn't understand that, can you please repeat that?", "I'm sorry I didn't understand that, can you please repeat that?");
        }    
    },

    'TypeConfirmationState' : {
        "AMAZON.YesIntent" : function() {
            let dbValue = this.getSessionAttribute('bookingType');
            this.followUpState('TimeAndDate')
                .ask("Ok, great. When would you like to book your " + dbValue + "?",
                    "Please give me a time.");
        },
        "AMAZON.NoIntent" : function() {
            this.followUpState('BookingType')
                .ask("Ok, please try saying it a different way then.", "Repeat yourself please.");
        },
        'Unhandled' : function() {
            this.ask("I'm sorry I didn't understand that, can you please repeat that?", "I'm sorry I didn't understand that, can you please repeat that?");
        }   
    },

    'TimeAndDate' : {

        'timeIntent' : function(date, time) {
            var dateString,timeString;
            try{
                dateString = date.value;
            } catch(err){
                this.followUpState("TimeAndDate").ask("Please provide a date and a time.", "I need a date and a time.");
                return;
            } try{
                timeString = time.value;
            } catch(err){
                this.followUpState("TimeAndDate").ask("Please provide a date and a time.", "I need a date and a time.");
                return;
            }
            var rawTime = dateString + "T" + timeString + ":00Z";
            var startObject = new Date(rawTime);
            var endObject = moment(startObject).add(30, 'm').toDate();
            let startTime = startObject.toUTCString();
            let endTime = endObject.toUTCString();
            this.addSessionAttribute('startTime', startTime);
            this.addSessionAttribute('endTime', endTime);
            this.followUpState('BusinessName')
                    .ask("If you know what business you would like to book with, say their name now." /*Otherwise, say, I don't know, to hear available options."*/,"Say your desired business name, or I don't know."); 
        },
        'Unhandled' : function() {
            this.ask("I'm sorry I didn't understand that, can you please repeat that?", "I'm sorry I didn't understand that, can you please repeat that?");
        }   
    },

    'BusinessName' : {
        "dontKnow" : {
            //recommend other businesses of same type here TODO
        },
        'businessCatchAll' : function(businessName) {
            return checkForKeyValue(businessName.value, 'businessNames')
            .then((dbValue) => {
                if (typeof dbValue === "string"){
                    this.addSessionAttribute('businessName', dbValue);
                    const getBody = {
                        TableName:'Businesses',
                        FilterExpression:'businessName = :businessName',
                        ExpressionAttributeValues:{ ":businessName" : dbValue }
                    };
                    return docClient.scan(getBody).promise()
                        .then((data) => {
                            if (data != undefined) {
                                var sessionString;
                                var response = "There are multiple locations of this business, which one would you like to book with? Your options are ";
                                console.log("Querying for all businesses in database");

                                var params = {
                                    TableName: "Businesses",
                                    FilterExpression: "#businessName = :businessNameVal",
                                    ExpressionAttributeNames: {
                                        "#businessName": "businessName",
                                    },
                                    ExpressionAttributeValues: { ":businessNameVal": 'a-list beauty team' }
                                
                                };

                                var count = 0;
                                function onScan(err, data) {
                                    if (err) {
                                        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
                                    } else {        
                                        console.log("Scan succeeded.");
                                        data.Items.forEach(function(itemdata) {
                                           console.log("Item :", ++count,JSON.stringify(itemdata));
                                           response += JSON.stringify(itemdata.location);
                                           console.log("Response: " + response);
                                        });
                                
                                        // continue scanning if we have more items
                                        if (typeof data.LastEvaluatedKey != "undefined") {
                                            console.log("Scanning for more...");
                                            params.ExclusiveStartKey = data.LastEvaluatedKey;
                                            docClient.scan(params, onScan);
                                        }
                                    }
                                }
                                
                                docClient.scan(params, onScan);
                                console.log(JSON.stringify(sessionString));
                                this.addSessionAttribute('possibleLocations', sessionString);
                                this.followUpState('LocationName').ask(response);
                            } else {
                                this.addSessionAttribute('locationName', data.locationName);
                                this.toStatelessIntent('FinalizeBooking');
                            }
                        })
                        .catch((err) =>{
                            console.log(err);
                        });
                } else if (dbValue !== null) {
                    this.followUpState('BusinessConfirmation')
                        .ask("I'm sorry, I had a hard time understanding what you said. Did you mean to say " + dbValue.target + " ?",
                            "Say yes if that is what you meant, say no if it isn't.");
                } else {
                    this.followUpState('BusinessName').ask("I'm sorry, I had some trouble processing what you said, can you please repeat yourself?",
                                "Please repeat yourself.");
                }
            });   
        },
        'Unhandled' : function() {
            this.ask("I'm sorry I didn't understand that, can you please repeat that?", "I'm sorry I didn't understand that, can you please repeat that?");
        }   
    },

    'BusinessConfirmation' : {
        'AMAZON.YesIntent' : function() {
            this.toStatelessIntent('FinalizeBooking');
        },
        'AMAZON.NoIntent' : function() {
            this.followUpState('BusinessName')
                .ask("Ok, please try saying it again. Or, say I don't know, to hear your options.", "Ok, please try saying it again. Or, say I don't know, to hear your options.");
        },
        'Unhandled' : function() {
            this.ask("I'm sorry I didn't understand that, can you please repeat that?", "I'm sorry I didn't understand that, can you please repeat that?");
        }   
    },

    'LocationName' : {
        'pickLocationIntent' : function(locationName) {
            if (typeof locationName.value != undefined){
                let locName = locationName.value;
                let possibleLocations = this.getSessionAttribute('possibleLocations');
                var matches = stringSimilarity.findBestMatch(locName, possibleLocations);
                let bestMatch = matches.bestMatch.target;
                if (matches.bestMatch.rating > 0.7){
                    this.setSessionAttribute('locationName', bestMatch);
                    this.toStatelessIntent('FinalizeBooking');
                } else{
                    this.followUpState('LocationConfirmation')
                        .ask("I'm sorry, I had a hard time understanding what you said. Did you mean to say " + bestMatch + " ?",
                        "Say yes if that is what you meant, say no if it isn't.")
                }
            }
        },
        'Unhandled' : function() {
            this.ask("I'm sorry I didn't understand that, can you please repeat that?", "I'm sorry I didn't understand that, can you please repeat that?");
        }   
    },

    'LocationConfirmation' : {
        'AMAZON.YesIntent' : function() {
            this.toStatelessIntent('FinalizeBooking');
        },
        'AMAZON.NoIntent' : function() {
            this.followUpState('LocationName').ask("Ok, please try saying it again.", "Ok, please try saying it again.");
        },
        'Unhandled' : function() {
            this.ask("I'm sorry I didn't understand that, can you please repeat that?", "I'm sorry I didn't understand that, can you please repeat that?");
        }   
    },

    'FinalizeBooking' : function() {
        let bookingType = this.getSessionAttribute('bookingType');
        let startTime = this.getSessionAttribute('startTime');
        let endTime = this.getSessionAttribute('endTime');
        let businessName = this.getSessionAttribute('businessName');
        let locationName = this.getSessionAttribute('locationName');
        let confirmationResponse = `Let me make sure I got this right. I have you for a ${bookingType} from ${startTime} until 
        ${endTime} at ${businessName} in ${locationName}. Does that all sound right to you?`;
        this.followUpState("OrderConfirmationState").ask(confirmationResponse, confirmationResponse);
    },
   
    'OrderConfirmationState' : {
        'AMAZON.YesIntent' : function() {
            let bookingType = this.getSessionAttribute('bookingType');
            let startTime = this.getSessionAttribute('startTime');
            let endTime = this.getSessionAttribute('endTime');
            let businessName = this.getSessionAttribute('businessName');
            let locationName = this.getSessionAttribute('locationName');
            const getBody = {
                TableName: "Businesses",
                Key: {
                    businessName: business.value,
                    locationName: location.value
                }
            };
            return this.user().getName()
                .then((name) => {
                    this.user().getEmail()
                        .then((email) => {
                            docClient.get(getBody).promise()
                                .then((data) => {
                                    //succesfully made it down the waterfall
                                    let resNames = data.resourceNames;
                                    let resourceIndex = resNames.indexOf(appointmentType.value);
                                    let resourceID = data.resourceID[resourceIndex];
                                    let bookingAPIPayload = 
                                    `{
                                        "resource_id":"${resourceID}",
                                        "graph":"instant",
                                        "what":"${appointmentType},
                                        "where":"${location.value}",
                                        "description":"${appointmentType.value} booking",
                                        "customer":{
                                            "name":"${name}",
                                            "email":"${email}"
                                        },
                                        "start":"${startTime}",
                                        "end":"${endTime}"
                                    }`;
                                    let authToken = data.apiToken;
                                    var options = {
                                        method: 'POST',
                                        uri: 'https://api.timekit.io/v2/bookings',
                                        body: {
                                            some: bookingAPIPayload
                                        },
                                        json: true,
                                        resolveWithFullResponse: true
                                    };
                                    request(options)
                                        .then((response) => {
                                            //if (response.statusCode === 200){
                                                this.tell("Your " + appointmentType + " was successfully booked! Check your email for confirmation.");
                                            //}
                                        })
                                        .catch((err) =>{
                                            console.log(err);
                                        })
                                })
                                .catch((err) => {
                                    console.log(err);
                                    console.log("error in getting the document");
                                    this.toIntent('nearbyBusiness')
                                });
                        })
                        .catch((error) => {
                            if (error.code === 'NO_USER_PERMISSION') {
                                this.alexaSkill().showAskForContactPermissionCard('email')
                                    .tell(`Please grant access to your email address.`);
                            }
                        });
                }).catch((error) => {
                    if (error.code === 'NO_USER_PERMISSION') {
                        this.alexaSkill().showAskForContactPermissionCard('name')
                            .tell(`Please grant access to your full name.`);
                    }
                });
        },
        'AMAZON.NoIntent' : function() {
            this.followUpState('BookingType').ask("Ok, let's try this again. What type of booking would you like to make?"
                                                ,"Ok, let's try this again. What type of booking would you like to make?")
        },
        'Unhandled' : function() {
            this.ask("I'm sorry I didn't understand that, can you please repeat that?", "I'm sorry I didn't understand that, can you please repeat that?");
        }   
    },

});

function checkForKeyValue(inputValue, keyType) {
    const getBody = {
        TableName: "MasterDoc",
        Key: {
            businessID: 987654321
        }
    };
    return docClient.get(getBody).promise()
        .then((data) => {
            let json = data.Item;
            var valuesArray;
            switch(keyType){
                case 'bookingType':
                    valuesArray = json.bookingType["values"];
                    break;
                case 'businessNames':
                    valuesArray = json.businessNames["values"];
                    break;
                case 'locationTags':
                    valuesArray = json.locationTags["values"];
            }
            console.log("db array: " + valuesArray + "value: " + inputValue);
            var matches = stringSimilarity.findBestMatch(inputValue, valuesArray);
            if (matches.bestMatch.rating > 0.5){
                return matches.bestMatch.target;
            } else{
                return matches.bestMatch;
            }
        })
        .catch((err) => {
            console.log(err);
            console.log("Error getting master document");
            return null;
        });
}



module.exports.app = app;
