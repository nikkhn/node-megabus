'use strict';

var megabus = require('../lib');

var findTix = new megabus.TicketFinder({
    startDate: '2/1/2016',
    endDate: '2/28/2016',
    routes: [
        new megabus.Route('New York', 'Toronto'),
        new megabus.Route('Toronto', 'New York')
    ]
});
    

function getTickets (){ 
console.log("Tickets found between " + findTix.startDate + " and " + findTix.endDate);
findTix.getTicketsPromise().then(function(tickets) { //the callback function
       tickets.forEach( function(ticket) { //for each ticket that it finds
       console.log(ticket.toString());
      });
    });  
}

getTickets();