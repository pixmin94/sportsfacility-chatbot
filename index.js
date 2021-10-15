'use strict';
 
const functions = require('firebase-functions'); 
const admin=require('firebase-admin'); 
admin.initializeApp ({
    credential:admin.credential.applicationDefault(),
    //insert your firebase database URL below
  
    databaseURL: 'https://sporty-bot3-tauw-default-rtdb.firebaseio.com/'
  //example  : databaseURL: 'https://xxxxxxxxxxxxxxxx.firebaseio.com/'
 });
 
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

//start nodemailer configuration
const nodemailer=require('nodemailer');
const mailTransport = nodemailer.createTransport({
    service: 'Outlook365',
    auth:{
        user: 'pixmin@outlook.com',
        pass: 'xxx'
    }
});
//end nodemailer configuration
//add the code below

 
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`); 
  }

  
  function  handleFacilityBooking(agent){
    var sport = agent.parameters.sport;
    var location = agent.parameters.location;
    var phone = agent.parameters.phone;
    var time = agent.parameters.time;
    const RecipientEmail = agent.parameters.email;
   return admin.database().ref('booking/'+phone).set({
     sport:sport, 
     location:location,
     time:time,
     email:RecipientEmail
   }, function (error){
    if (error) {
      agent.add("Failed to process the booking. Please try again.");
    } else {
      agent.add("Sure! We have completed the booking for "+sport+" at "+location+" at "+time+"! A confirmation email will be sent to "+RecipientEmail);
    }
    
    
    const EmailSubject = 'Sports Booking Confirmation';
    const EmailBody ='Dear customer,'+
        '<p> This is an automatically generated email for your sports facility booking.'+
        '<p> Please remember to come 5-10mins before your booking slot to register .' +
        '<p><strong> Sport: </strong>' + sport +
        '<br><strong> Location: </strong>' + location +
        '<br><strong> Time: </strong>' + time +
        '<p> Hope you have a good workout!'+
        '<p> Regards, Sporty Botbot';
    
 
    // Code for sending email to customer
    sendEmail(RecipientEmail, EmailSubject, EmailBody);

   });
}
     

function  handleCallBackCustomer(agent){

    var phone = agent.parameters.phone;
    const RecipientEmail = '2071507d@student.tp.edu.sg';
   return admin.database().ref('callback/'+phone).set({
     phone:phone
   }, function (error){
    if (error) {
      agent.add("We have encountered an error. Please wait awhile and try again.");
    } else {
      agent.add("Awesome! A customer representative will call you back at "+phone+"!");
    }
    
    
    const EmailSubject = 'Callback request by customer';
    const EmailBody ='Hi Jane,'+
        '<p> We have received a callback request.'+
        '<p> Please contact the customer as soon as possible at the following number:' +
        '<p>' + phone +
        '<p> Regards, Sporty Botbot';
    
 
    // Code for sending email to customer
    sendEmail(RecipientEmail, EmailSubject, EmailBody);

   });
}


  function handleCheckBooking(agent) { 
    const phone=agent.parameters.phone;
    console.log(phone);
 		return admin.database().ref('booking/'+phone).once('value').then((snapshot)=> {
          const sport=snapshot.child('sport').val();
          const location=snapshot.child('location').val();
          const time=snapshot.child('time').val();
          if(sport!== null)
            agent.add("Your booking details : "+sport+" at "+location+" at "+time+".");
          else
            agent.add("Booking not found. Please try again.");
          
  });
}

// Sends email to the customer's email
function sendEmail(RecipientEmail,EmailSubject,EmailBody) {
    const mailOptions = {
        from: 'pixmin@outlook.com',
        to: RecipientEmail
    };
    mailOptions.subject = EmailSubject;
    mailOptions.html = EmailBody;
    return mailTransport.sendMail(mailOptions).then(() => {
        return console.log('Email sent to:', RecipientEmail);
    });
}

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('facility_booking', handleFacilityBooking);
  intentMap.set('check_booking', handleCheckBooking); 
  intentMap.set('speak_to_rep', handleCallBackCustomer); 
  agent.handleRequest(intentMap);
});