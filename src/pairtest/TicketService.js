import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";
import constants from "./constants.js";
import isPositive from "./helper.js";

export default class TicketService {
  /**
   * @param {TicketPaymentService} ticketPaymentService - The payment service
   * @param {SeatReservationService} seatReservationService - The seat reservation service
   */
  constructor(ticketPaymentService, seatReservationService) {
    if (!(ticketPaymentService instanceof TicketPaymentService)) {
      throw new InvalidPurchaseException(
        "Invalid dependency: ticketPaymentService must be an instance of TicketPaymentService"
      );
    }
    if (!(seatReservationService instanceof SeatReservationService)) {
      throw new InvalidPurchaseException(
        "Invalid dependency: seatReservationService must be an instance of SeatReservationService"
      );
    }
    this.ticketPaymentService = ticketPaymentService;
    this.seatReservationService = seatReservationService;
  }
  /**
   * @description - a public method to purchase a tickets and reserve requested seats
   * @param {string} accountId - a first argument in the request retrieve as a account id
   * @param {array} ticketTypeRequests - a rest of arguments which is an array of tickets objects request by purchaser
   * @returns {object} - a purchased tickets reservation confirmation details like seats allocated, amount paid, total tickets
   */
  purchaseTickets(accountId, ...ticketTypeRequests) {
    // check if accountId is valid or not
    if (!isPositive(accountId)) {
      throw new InvalidPurchaseException(
        "Invalid request! AccountId must be a valid value."
      );
    }
    if (!ticketTypeRequests.length) {
      throw new InvalidPurchaseException("Invalid ticket request!");
    }

    const { totalNoOfTickets, totalSeats, totalAmount, adultTickets } =
      this.#handleTicketTypeRequests(ticketTypeRequests);
    console.log(totalNoOfTickets, totalSeats, totalAmount, adultTickets);
    if (
      !isPositive(totalNoOfTickets) ||
      !isPositive(totalSeats) ||
      !isPositive(totalAmount)
    ) {
      throw new InvalidPurchaseException("Invalid ticket request!");
    }

    // check for max tickets cap (25 tickets per request)
    if (totalNoOfTickets > constants.MAX_TICKET_LIMIT) {
      throw new InvalidPurchaseException(
        `Maximum of ${constants.MAX_TICKET_LIMIT} tickets are allowed at a time!`
      );
    }

    if (adultTickets === 0 && totalNoOfTickets - adultTickets > 0) {
      throw new InvalidPurchaseException(
        "At least one adult ticket is required when purchasing Child or Infant tickets."
      );
    }

    // Process Payment
    this.ticketPaymentService.makePayment(accountId, totalAmount);
    // Reserve Seats
    this.seatReservationService.reserveSeat(accountId, totalSeats);

    return {
      message: "Congratulation! Successfully booked your seat.",
      accountId,
      totalAmount,
      totalSeats,
      totalNoOfTicketsBooked: totalNoOfTickets,
    };
  }

  /**
   * @description - a private method to parse input and process ticket details
   * @param {Array} ticketTypeRequests - an array of TicketTypeRequest objects
   * @returns {object} - a parsed ticket details values of a purchaser
   */
  #handleTicketTypeRequests(ticketTypeRequests = []) {
    let totalNoOfTickets = 0;
    let totalSeats = 0;
    let totalAmount = 0;
    let adultTickets = 0;
    ticketTypeRequests.forEach((ticketTypeRequest) => {
      if (!(ticketTypeRequest instanceof TicketTypeRequest)) {
        throw new InvalidPurchaseException(
          "Invalid Ticket! Requested ticket is not an instance of TicketTypeRequest class."
        );
      }
      const ticketType = ticketTypeRequest.getTicketType();
      const ticketCount = ticketTypeRequest.getNoOfTickets();
      switch (ticketType) {
        case constants.TICKET_ADULT:
          adultTickets += ticketCount;
          totalNoOfTickets += ticketCount;
          totalSeats += ticketCount;
          totalAmount += ticketCount * constants.TICKET_COST_ADULT;
          break;
        case constants.TICKET_CHILD:
          totalNoOfTickets += ticketCount;
          totalSeats += ticketCount;
          totalAmount += ticketCount * constants.TICKET_COST_CHILD;
          break;
        case constants.TICKET_INFANT:
          totalNoOfTickets += ticketCount;
          break;
        default:
          throw new Error("Unknown ticket type!");
      }
    });
    return { totalNoOfTickets, totalSeats, totalAmount, adultTickets };
  }
}
