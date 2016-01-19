'use strict';

const querystring = require('querystring');

 /**
     * Other npm module depenencies 
     */
const _ = require('lodash'); //
const cheerio = require('cheerio'); //used to load html from megabus site 
const fetch = require('node-fetch'); //used to make GET request to megabus site 
const moment = require('moment'); //used to format dates 

 /**
     * Numeric codes representing cities served by Megabus 
     */
exports.LOCATION_CODES = {
  'Boston': 94,
  'Chicago': 100,
  'Toronto': 145,
  'New Haven': 122,
  'New York': 123,
};

 /**
     * Creates a route between 2 cities 
     * @param {string} origin - Location Code of origin city 
     * @param {string} destination - Location Code of destination city 
     */
class Route {
  constructor(origin, destination) {
    if (!exports.LOCATION_CODES[origin]) { //if origin is not valid location code, throw error
      throw new Error(`Unknown origin: ${origin}`);
    }
    if (!exports.LOCATION_CODES[destination]) { //if desination is not valid location code, throw error 
      throw new Error(`Unknown destination: ${destination}`); 
    }
    this.origin = origin;
    this.originCode = exports.LOCATION_CODES[origin]; //get code of origin city 
    this.destination = destination;
    this.destinationCode = exports.LOCATION_CODES[destination]; //get code of destination city 
  }
}

 /**
     * Create a ticket 
     * @param {string} data - object with multiple attributes of a ticket 
     */
class Ticket { 
  constructor(data) {
    this.origin = data.origin;
    this.destination = data.destination;
    this.date = data.date;
    this.departure = data.departure;
    this.arrival = data.arrival;
    this.price = data.price;
  }

   /**
     * @return {string} - data for route between 2 cities: price, origin, destination, date of departure, date of arrival
     */
  toString() {
    return `{$${this.price}} ${this.origin} -> ${this.destination} (${this.date} ${this.departure} - ${this.arrival})`; 
  }
}

  /**
     * Creates TicketFinder for making the search
     * @param {string} data -  object with multiple attributes of a ticket query
     */
class TicketFinder {
  constructor(data) {
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.routes = data.routes; //desired Route(s)
  }

  /**
     * Builds a URL with headers to query megabus website 
     * @param {string} date - Date of departure from origin in format 'mm/dd/yyyy'
     * @param {string} originCode - Code representing city of origin
     * @param {string} departureCode - Code representing city 
     * @return {string} concatenated base URL + inputted headers
     */
  _buildURL(date, originCode, departureCode) { 
    let qs = querystring.stringify({ 
      originCode: originCode,
      destinationCode: departureCode,
      outboundDepartureDate: date,
      inboundDepartureDate: '',
      passengerCount: 1,
      transportType: 0,
      concessionCount: 0,
      nusCount: 0,
      outboundWheelchairSeated: 0,
      outboundOtherDisabilityCount: 0,
      inboundWheelchairSeated: 0,
      inboundOtherDisabilityCount: 0,
      outboundPcaCount: 0,
      inboundPcaCount: 0,
      promotionCode: '',
      withReturn: 0
    });
    return `http://us.megabus.com/JourneyResults.aspx?${qs}`; //returns results from querying megabus website 
  }

  /**
     * Sends GET request 
     * @param {string} url - URL to GET 
     * @return {string} result of HTTP GET request as text  
     */
  _getHTMLPromise(url) {
    return fetch(url)
      .then((res) => {
        return res.text();
      });
  }

  /**
     * Parses the response from megabus website 
     * @param {string} html - html response from megabus website
     * @param {string} date - date of bus trip ()
     * @param {string} route - URL to GET 
     * @return {string} result as text 
     */
  _parseTickets(html, date, route) {
    let $ = cheerio.load(html); //loads HTML 
    let items = $('#JourneyResylts_OutboundList_main_div > ul') //gets bulk of html response
      .not('.heading') //removes "heading" from all items 
      .toArray(); 
    return items.map((item) => { //maps each result to its departure, arrival, and price attributes 
      let $item = $(item);
      let departure = /Departs\s+(.*)\s+/.exec($item.find('.two > p:nth-child(1)').text()); 
      let arrival = /Arrives\s+(.*)\s+/.exec($item.find('.two > p:nth-child(2)').text());
      let price = /\$([\d.]+)/.exec($item.find('.five > p').text());
      return new Ticket({ //creates new Ticket object with given properties from the HTTP request 
        origin: route.origin,
        destination: route.destination,
        date: date,
        departure: departure && departure[1], 
        arrival: arrival && arrival[1],
        price: price && +price[1]
      });
    });
  }


  /**
     * @param {int} min - Date of departure from origin in format 'mm/dd/yyyy'
     * @param {int} max - Code representing city of origin
     * @return {string} - returns getPicketsPromise() 
     */
  _getTicketsPromise(date, route) {
    let url = this._buildURL(date, route.originCode, route.destinationCode); //gets the built URL 
    return this._getHTMLPromise(url).then((html) => { //gets results of html call
      return this._parseTickets(html, date, route); //gets parsed result 
    });
  }

  /**
     * Gets available tickets from megabus site within date range specified in TicketFinder
     * @return {array} - returns array of all results from query 
     */
  getTicketsPromise() {
    let startDate = moment(this.startDate, 'MM/DD/YYYY');  //formats start date in mm/dd/yyyy format 
    let endDate = moment(this.endDate, 'MM/DD/YYYY');
    let promises = []; 
    for (let date = moment(startDate); !date.isAfter(endDate); date.add(1, 'days')) { //for each date is not after end date 
      this.routes.forEach((route) => {
        promises.push(this._getTicketsPromise(date.format('MM/DD/YYYY'), route)); //loads promises into an array from _getTicketsPromise of queries to megabus site  
      });
    }
    return Promise.all(promises) //returns Promise object that resolves when all of the sub-promises have resolved
      .then((results) => {  
        return _.flatten(results); //flattened results array 
      });
  }

  /**
     * Gets available tickets from megabus site within price range  
     * @param {int} min - minimum price 
     * @param {int} max - maximum price 
     * @return {array} - tickets between minimum and maximum prices 
     */
  getTicketsInPriceRangePromise(min, max) {
    return this.getTicketsPromise().then( //gets array of results from ticket query within specified price range
        (tickets) => { 
      return tickets.filter((ticket) => { //Creates new array of results 
        return min <= ticket.price && ticket.price <= max; //returns prices between min and max values 
      }
      );
    });
  }
}

  /**
     * Exports Route, Ticket, and TicketFinder as public classes 
     */
exports.Route = Route;
exports.Ticket = Ticket;
exports.TicketFinder = TicketFinder;
