'use strict';
/*
A promise is a pattern for handling asynchronous operations. 
The promise allows you to call a method called "then" that 
let's you specify the function(s) to use as the callbacks.
*/

const megabus = require('../lib');

megabus.LOCATION_CODES = {
  'Boston': 94,
  'Chicago': 100,
  'Toronto': 145,
  'New Haven': 122,
  'New York': 123,
};

if (module === require.main) {
  let finder = new megabus.TicketFinder({
    startDate: '1/1/2016',
    endDate: '3/14/2016',
    routes: [
      // New York <-> Boston
      new megabus.Route('New York', 'Boston'),
      new megabus.Route('Boston', 'New York'),

      // New York <-> Chicago
      new megabus.Route('New York', 'Chicago'),
      new megabus.Route('Chicago', 'New York'),

      // New York <-> New Haven
      new megabus.Route('New York', 'New Haven'),
      new megabus.Route('New Haven', 'New York'),

      // New York <-> Toronto
      new megabus.Route('New York', 'Toronto'),
      new megabus.Route('Toronto', 'New York'),
    ]

  });

  finder
    .getTicketsInPriceRangePromise(0, 15) //once this is done, it calls...
    .then((tickets) => { //the callback function
      tickets.forEach((ticket, idx) => { //for each ticket in Promise
        console.log(`[${idx + 1}] ${ticket.toString()}`); //print index and ticket information 
      })
      console.log(tickets);
      console.log(`*** ${tickets.length} tickets found ***`);
    });
    
    finder.getTicketsPromise

}
