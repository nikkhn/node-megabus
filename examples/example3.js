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



function showToString (){ 
findTix.getTicketsPromise().then(function(tickets) { 
       console.log(tickets[0].toString()); //prints first ticket in array 
      });
    };  

showToString();