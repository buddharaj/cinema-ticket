import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";
import constants from "./constants.js";
import isValidNumber from "./helper.js";
const ticketPaymentService = new TicketPaymentService();
const seatReservationService = new SeatReservationService();

export default class TicketService {
  /**
   * @description - a public method to purchase a tickets and reserve requested seats
   * @param {string} accountId - a first argument in the request retrieve as a account id
   * @param {array} ticketTypeRequests - a rest of arguments which is an array of tickets details objects request by purchaser
   * @returns {object} - a purchased tickets reservation confirmation details
   */
  purchaseTickets(accountId, ...ticketTypeRequests) {
    // check if accountId is valid or not
    if (!isValidNumber(accountId)) {
      throw new InvalidPurchaseException(
        "Invalid request! AccountId must be a valid value."
      );
    }
    if (!ticketTypeRequests.length) {
      throw new InvalidPurchaseException(
        "Invalid ticket request! Alteast one ticket request is required."
      );
    }
    // validate request and retrieve require details into an object
    const parsedTicketTypeRequest =
      this.#parseTicketTypeRequests(ticketTypeRequests);

    // check if requested tickets are without accompaying adult purchaser
    if (!parsedTicketTypeRequest[constants.TICKET_ADULT]) {
      throw new InvalidPurchaseException(
        "Tickets cannot be purchased without purchasing an Adult ticket"
      );
    }

    const totalNoOfTickets = this.#calculateTotalNoOfTickets(
      parsedTicketTypeRequest
    );
    // check for max tickets cap (25 tickets) per request
    if (totalNoOfTickets > constants.MAX_TICKET_LIMIT) {
      throw new InvalidPurchaseException(
        `Maximum of ${constants.MAX_TICKET_LIMIT} tickets are allowed at a time!`
      );
    }
    const totalAmountToPay = this.#calculateTicketsAmount(
      parsedTicketTypeRequest
    );

    this.#makePayment(accountId, totalAmountToPay);
    this.#makeBooking(accountId, totalNoOfTickets);
    return {
      message: "Congratualtion. Successfully booked!",
      accountId,
      totalAmountPaid: totalAmountToPay,
      totalNoOfTicketsBooked: totalNoOfTickets,
    };
  }

  /**
   * @description - a private method to validate ticket type requests and retrieve required ticket details
   * @param {Array} ticketTypeRequests - an array of TicketTypeRequest objects
   * @returns {object} - a parsed strcutured object containing ticket details retrived from input
   */
  #parseTicketTypeRequests(ticketTypeRequests = []) {
    const parsedTicketTypeRequest = {};
    // check for each ticket request is valid or not
    ticketTypeRequests.forEach((ticketTypeRequest) => {
      const [ticketType, noOfTickets] =
        this.#getTicketDetails(ticketTypeRequest);
      if (
        !ticketType ||
        ![
          constants.TICKET_ADULT,
          constants.TICKET_CHILD,
          constants.TICKET_INFANT,
        ].includes(ticketType)
      ) {
        throw new InvalidPurchaseException("Invalid ticket type!");
      }
      if (!isValidNumber(noOfTickets)) {
        throw new InvalidPurchaseException("Invalid number of tickets!");
      }
      parsedTicketTypeRequest[ticketType] = noOfTickets;
    });
    return parsedTicketTypeRequest;
  }

  /**
   * @description - a private method to calculate total ticket amount considering bussiness rules
   * @param {Object} tickets - ticket details of a purchaser
   * @returns {number} - total ticket cost
   */
  #calculateTicketsAmount(tickets) {
    return (
      tickets[constants.TICKET_ADULT] * constants.TICKET_COST_ADULT +
      (tickets[constants.TICKET_CHILD] ?? 0) * constants.TICKET_COST_CHILD
    );
  }

  /**
   * @description - a private method to calculate total number of ticket considering bussiness rules
   * @param {Object} tickets - ticket details of a purchaser
   * @returns {number} - total number of tickets
   */
  #calculateTotalNoOfTickets(tickets) {
    return (
      tickets[constants.TICKET_ADULT] + (tickets[constants.TICKET_CHILD] ?? 0)
    );
  }

  /**
   * @description - a private method to retrieve ticket details using given input
   * @param {Object} tktTypeReqObj - an instance of TicketTypeRequest class which contains ticket details
   * @returns {ticketType, noOfTickets} - return two variables which contains ticket type and number of tickets
   */
  #getTicketDetails(tktTypeReqObj) {
    if (!(tktTypeReqObj instanceof TicketTypeRequest)) {
      throw new InvalidPurchaseException(
        "Invalid Ticket! Requested ticket is not an instance of TicketTypeRequest."
      );
    }
    const ticketType = tktTypeReqObj.getTicketType();
    const noOfTickets = tktTypeReqObj.getNoOfTickets();
    return [ticketType, noOfTickets];
  }

  /**
   * @description - a private method to call a third party service to make a payment
   * @param {string} accountId - account id
   * @param {number} totalAmountToPay - total amount for requested tickets
   * @returns {boolean} - return true if successfull payment otherwise throw error
   */
  #makePayment(accountId, totalAmountToPay) {
    if (totalAmountToPay <= 0) {
      throw new InvalidPurchaseException(
        "Total amount should be a valid value!"
      );
    }
    try {
      ticketPaymentService.makePayment(accountId, totalAmountToPay);
    } catch (error) {
      throw new InvalidPurchaseException(error.message);
    }
    return true;
  }

  /**
   * @description - a private method to call a third party service to make a reservation
   * @param {string} accountId - account id
   * @param {number} totalSeatsToAllocate - total seats to be reserved
   * @returns {boolean} - return true if successfull seat reservation otherwise throw error
   */
  #makeBooking(accountId, totalSeatsToAllocate) {
    if (totalSeatsToAllocate <= 0) {
      throw new InvalidPurchaseException(
        "Total seats should be a valid value!"
      );
    }
    try {
      seatReservationService.reserveSeat(accountId, totalSeatsToAllocate);
    } catch (error) {
      throw new InvalidPurchaseException(error.message);
    }
  }
}
