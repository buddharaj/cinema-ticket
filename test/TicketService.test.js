import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import TicketService from "../src/pairtest/TicketService";
import constants from "../src/pairtest/constants";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService";
import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException";

jest.mock("../src/thirdparty/paymentgateway/TicketPaymentService");
jest.mock("../src/thirdparty/seatbooking/SeatReservationService");
describe("Test Scenarios for TicketService:-", () => {
  let ticketService;
  let mockTicketPaymentService;
  let mockSeatReservationService;
  beforeEach(() => {
    mockTicketPaymentService = new TicketPaymentService();
    mockSeatReservationService = new SeatReservationService();
    // Mocking third-party methods
    mockTicketPaymentService.makePayment = jest.fn(); // Mock makePayment method
    mockSeatReservationService.reserveSeat = jest.fn(); // Mock reserveSeat method

    ticketService = new TicketService(
      mockTicketPaymentService,
      mockSeatReservationService
    );
  });
  afterEach(() => {
    jest.restoreAllMocks(); // Clean up mocks after each test
  });
  it("Should accept a seat reservation request", () => {
    const accountId = 1;
    const adultTickets = new TicketTypeRequest(constants.TICKET_ADULT, 2);
    const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, 4);
    const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, 1);
    const response = ticketService.purchaseTickets(
      accountId,
      adultTickets,
      childTickets,
      infantTickets
    );

    expect(response).toHaveProperty(
      "message",
      "Congratulation! Successfully booked your seat."
    );
    const expectedTotalAmountToPayToPay =
      constants.TICKET_COST_ADULT * 2 + constants.TICKET_COST_CHILD * 4;
    // Assert: Check if makePayment was called with the correct amount
    expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(
      accountId,
      expectedTotalAmountToPayToPay
    );

    // Assert: Check if reserveSeat was called with the correct seat count
    expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(
      accountId,
      6
    ); // (2 Adults + 4 Children = 6 seats, Infants don’t need seats)
  });
  it("Should accept a seat reservation request of maximum of 25 tickets at a time", () => {
    const adultTickets = new TicketTypeRequest(constants.TICKET_ADULT, 10);
    const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, 10);
    const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, 5);
    const accountId = 1;
    const response = ticketService.purchaseTickets(
      accountId,
      adultTickets,
      infantTickets,
      childTickets
    );
    expect(response).toHaveProperty(
      "message",
      "Congratulation! Successfully booked your seat."
    );
    const expectedTotalAmountToPay =
      constants.TICKET_COST_ADULT * 10 + constants.TICKET_COST_CHILD * 5;
    expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(
      accountId,
      expectedTotalAmountToPay
    );
    expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(
      accountId,
      15
    );
  });
  it("Should throw an error if more than 25 tickets are requested at a time", () => {
    const adultTickets = new TicketTypeRequest(constants.TICKET_ADULT, 26);
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
  it("Should throw an error if child or infant tickets is requested without an adult ticket", () => {
    const infantTickets = new TicketTypeRequest(constants.TICKET_INFANT, 2);
    const childTickets = new TicketTypeRequest(constants.TICKET_CHILD, 3);
    const accountId = 1;
    expect(() =>
      ticketService.purchaseTickets(accountId, infantTickets, childTickets)
    ).toThrow(InvalidPurchaseException);
    expect(() =>
      ticketService.purchaseTickets(accountId, infantTickets, childTickets)
    ).toThrow(
      "At least one adult ticket is required when purchasing Child or Infant tickets."
    );
  });
  it("Should throw an error if account id is invalid - 0", () => {
    const accountId = 0;
    const ticket = new TicketTypeRequest(constants.TICKET_ADULT, 1);
    expect(() => ticketService.purchaseTickets(accountId, ticket)).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets(accountId, ticket)).toThrow(
      "Invalid request! AccountId must be a valid value."
    );
  });

  it("Should throw an error if account id is invalid - negative value", () => {
    const accountId = -1;
    const ticket = new TicketTypeRequest(constants.TICKET_ADULT, 1);
    expect(() => ticketService.purchaseTickets(accountId, ticket)).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets(accountId, ticket)).toThrow(
      "Invalid request! AccountId must be a valid value."
    );
  });

  it("Should throw an error when purchaser do not declares how many tickets they want to buy", () => {
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
    ).toThrow("Invalid ticket request!");
  });
  it("Should throw an error when negative tickets are supplied", () => {
    const ticket = new TicketTypeRequest(constants.TICKET_ADULT, -2);
    const accountId = 1;
    expect(() => ticketService.purchaseTickets(accountId, ticket)).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets(accountId, ticket)).toThrow(
      "Invalid ticket request!"
    );
  });

  it("Should throw an error when empty arguments", () => {
    expect(() => ticketService.purchaseTickets()).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets()).toThrow(
      "Invalid request! AccountId must be a valid value."
    );
  });
  it("Should throw an error when none ticket is requested", () => {
    const accountId = 1;
    expect(() => ticketService.purchaseTickets(accountId)).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets(accountId)).toThrow(
      "Invalid ticket request!"
    );
  });
  it("Should throw an error when wrong ticket is requested - string value in TicketTypeRequest", () => {
    const wrongTicket = "test";
    const accountId = 1;
    expect(() => ticketService.purchaseTickets(accountId, wrongTicket)).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets(accountId, wrongTicket)).toThrow(
      "Invalid Ticket! Requested ticket is not an instance of TicketTypeRequest class."
    );
  });
});
