import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import TicketService from "../src/pairtest/TicketService";
import constants from "../src/pairtest/constants";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService";
import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException";

const ticketService = new TicketService();
const ticketPaymentService = new TicketPaymentService();
const seatReservationService = new SeatReservationService();
describe("Test Scenarios for TicketService:-", () => {
  beforeEach(() => {
    ticketPaymentService.makePayment = jest.fn().mockResolvedValue(true);
    seatReservationService.reserveSeat = jest.fn().mockResolvedValue(true);
  });
  afterEach(() => {
    jest.restoreAllMocks(); // Clean up mocks after each test
  });
  it("Should accept a seat reservation request", () => {
    ticketPaymentService.makePayment = jest.fn().mockResolvedValue(true);
    seatReservationService.reserveSeat = jest.fn().mockResolvedValue(true);
    const adultTickets = new TicketTypeRequest(constants.TICKET_ADULT, 1);
    const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, 1);
    const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, 1);
    const accountId = 1;
    const response = ticketService.purchaseTickets(
      accountId,
      adultTickets,
      infantTickets,
      childTickets
    );
    expect(response).toHaveProperty(
      "message",
      "Congratualtion. Successfully booked!"
    );
  });
  it("Should accept a seat reservation request - adult only", () => {
    ticketPaymentService.makePayment = jest.fn().mockResolvedValue(true);
    seatReservationService.reserveSeat = jest.fn().mockResolvedValue(true);
    const adultTickets = new TicketTypeRequest(constants.TICKET_ADULT, 1);
    const accountId = 1;
    const response = ticketService.purchaseTickets(accountId, adultTickets);
    expect(response).toHaveProperty(
      "message",
      "Congratualtion. Successfully booked!"
    );
  });
  it("Should accept for Infants do not pay for a ticket", () => {
    const adultTickets = new TicketTypeRequest(constants.TICKET_ADULT, 2);
    const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, 3);
    const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, 4);
    const accountId = 1;
    const response = ticketService.purchaseTickets(
      accountId,
      adultTickets,
      infantTickets,
      childTickets
    );
    const expectedTotalAmountPaid =
      constants.TICKET_COST_ADULT * 2 + constants.TICKET_COST_CHILD * 4;
    expect(response).toHaveProperty(
      "message",
      "Congratualtion. Successfully booked!"
    );
    expect(response).toHaveProperty("totalAmountPaid", expectedTotalAmountPaid);
  });
  it("Should accept for Infants are not allocated a seat", () => {
    const adultTickets = new TicketTypeRequest(constants.TICKET_ADULT, 2);
    const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, 3);
    const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, 4);
    const accountId = 1;
    const response = ticketService.purchaseTickets(
      accountId,
      adultTickets,
      infantTickets,
      childTickets
    );
    expect(response).toHaveProperty(
      "message",
      "Congratualtion. Successfully booked!"
    );
    expect(response).toHaveProperty("totalNoOfTicketsBooked", 6);
  });
  it("Should accept a seat reservation request of maximum of 25 tickets at a time", () => {
    const adultTickets = new TicketTypeRequest(constants.TICKET_ADULT, 10);
    const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, 10);
    const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, 15);
    const accountId = 1;
    const response = ticketService.purchaseTickets(
      accountId,
      adultTickets,
      infantTickets,
      childTickets
    );
    expect(response).toHaveProperty(
      "message",
      "Congratualtion. Successfully booked!"
    );
  });
  it("Should reject a request with more than 25 tickets at a time", () => {
    const adultTickets = new TicketTypeRequest(constants.TICKET_ADULT, 11);
    const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, 10);
    const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, 15);
    const accountId = 1;
    expect(() =>
      ticketService.purchaseTickets(
        accountId,
        adultTickets,
        infantTickets,
        childTickets
      )
    ).toThrow(InvalidPurchaseException);

    expect(() =>
      ticketService.purchaseTickets(
        accountId,
        adultTickets,
        infantTickets,
        childTickets
      )
    ).toThrow(
      `Maximum of ${constants.MAX_TICKET_LIMIT} tickets are allowed at a time!`
    );
  });
  it("Should reject when purchaser do not declares how many tickets they want to buy", () => {
    const adultTickets = new TicketTypeRequest(constants.TICKET_ADULT, 0);
    const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, 0);
    const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, 0);
    const accountId = 1;
    expect(() =>
      ticketService.purchaseTickets(
        accountId,
        adultTickets,
        infantTickets,
        childTickets
      )
    ).toThrow(InvalidPurchaseException);
    expect(() =>
      ticketService.purchaseTickets(
        accountId,
        adultTickets,
        infantTickets,
        childTickets
      )
    ).toThrow("Invalid number of tickets!");
  });
  it("Should reject when negative tickets are supplied wrongly", () => {
    const adultTickets = new TicketTypeRequest(constants.TICKET_ADULT, -2);
    const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, -3);
    const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, -1);
    const accountId = 1;
    expect(() =>
      ticketService.purchaseTickets(
        accountId,
        adultTickets,
        infantTickets,
        childTickets
      )
    ).toThrow(InvalidPurchaseException);
    expect(() =>
      ticketService.purchaseTickets(
        accountId,
        adultTickets,
        infantTickets,
        childTickets
      )
    ).toThrow("Invalid number of tickets!");
  });
  it("Should reject when purchaser do not declares what type of tickets they want to buy", () => {
    try {
      const adultTickets = new TicketTypeRequest("", 0);
      const accountId = 1;
      ticketService.purchaseTickets(accountId, adultTickets);
    } catch (error) {
      expect(error.message).toBe("type must be ADULT, CHILD, or INFANT");
    }
  });
  it("Should reject when ticket type is other than allowed (adult, infant or child)", () => {
    try {
      const adultTickets = new TicketTypeRequest("test", 0);
      const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, 0);
      const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, 0);
      const accountId = 1;
      ticketService.purchaseTickets(
        accountId,
        adultTickets,
        infantTickets,
        childTickets
      );
    } catch (error) {
      expect(error.message).toBe("type must be ADULT, CHILD, or INFANT");
    }
  });
  it("Should reject when attempting to purchase child and infant tickets without purchasing an adult ticket", () => {
    const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, 2);
    const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, 3);
    const accountId = 1;
    expect(() =>
      ticketService.purchaseTickets(accountId, infantTickets, childTickets)
    ).toThrow(InvalidPurchaseException);
    expect(() =>
      ticketService.purchaseTickets(accountId, infantTickets, childTickets)
    ).toThrow("Tickets cannot be purchased without purchasing an Adult ticket");
  });
  it("Should rejects any invalid ticket purchase requests - invalid accountId -1", () => {
    const accountId = -1;
    const adultTickets = new TicketTypeRequest(constants.TICKET_ADULT, 0);
    const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, 0);
    const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, 0);
    expect(() =>
      ticketService.purchaseTickets(
        accountId,
        adultTickets,
        infantTickets,
        childTickets
      )
    ).toThrow(InvalidPurchaseException);
    expect(() =>
      ticketService.purchaseTickets(
        accountId,
        adultTickets,
        infantTickets,
        childTickets
      )
    ).toThrow("Invalid request! AccountId must be a valid value.");
  });
  it("Should rejects any invalid ticket purchase requests - invalid accountId 0", () => {
    const accountId = 0;
    const adultTickets = new TicketTypeRequest(constants.TICKET_ADULT, 0);
    const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, 0);
    const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, 0);
    expect(() =>
      ticketService.purchaseTickets(
        accountId,
        adultTickets,
        infantTickets,
        childTickets
      )
    ).toThrow(InvalidPurchaseException);
    expect(() =>
      ticketService.purchaseTickets(
        accountId,
        adultTickets,
        infantTickets,
        childTickets
      )
    ).toThrow("Invalid request! AccountId must be a valid value.");
  });
  it("Should reject when empty input", () => {
    expect(() => ticketService.purchaseTickets()).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets()).toThrow(
      "Invalid request! AccountId must be a valid value."
    );
  });
  it("Should reject when none ticket is requested", () => {
    const accountId = 1;
    expect(() => ticketService.purchaseTickets(accountId)).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets(accountId)).toThrow(
      "Invalid ticket request! Alteast one ticket request is required."
    );
  });
  it("Should reject when wrong ticket is requested", () => {
    const wrongTicket = "test";
    const accountId = 1;
    expect(() => ticketService.purchaseTickets(accountId, wrongTicket)).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets(accountId, wrongTicket)).toThrow(
      "Invalid Ticket! Requested ticket is not an instance of TicketTypeRequest."
    );
  });
});
// describe.skip("Test Scenarios for TicketService:-", () => {
//   it("Should reject when wrong ticket is requested", () => {
//     const wrongTicket = "test";
//     const accountId = 1;
//     expect(() => ticketService.purchaseTickets(accountId, wrongTicket)).toThrow(
//       InvalidPurchaseException
//     );
//     expect(() => ticketService.purchaseTickets(accountId, wrongTicket)).toThrow(
//       "Invalid Ticket! Requested ticket is not an instance of TicketTypeRequest."
//     );
//   });
// });
