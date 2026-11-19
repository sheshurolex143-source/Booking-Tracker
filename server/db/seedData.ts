import { BookingCategory, CancellationRecord, RefundStatus } from '../../shared/types';

function daysAgoIso(days: number): string {
  const dt = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return dt.toISOString();
}

function daysOffsetDate(daysFromToday: number): string {
  const dt = new Date(Date.now() + daysFromToday * 24 * 60 * 60 * 1000);
  return dt.toISOString().slice(0, 10);
}

export function createInitialSeedRecords(): CancellationRecord[] {
  return [
    {
      id: 'canc-101',
      bookingTitle: 'Lufthansa LH-455 SFO to Frankfurt (Round Trip)',
      provider: 'Lufthansa',
      category: BookingCategory.Flight,
      bookingDate: daysOffsetDate(18),
      cancellationDate: daysOffsetDate(-17),
      referenceNumber: 'LH-RF-849201',
      expectedRefundAmount: 1285.4,
      currency: 'USD',
      status: RefundStatus.Pending,
      notes: 'Cancelled within 24h flexible fare window. Automated confirmation email received; no refund credit posted yet.',
      followUpHistory: [
        {
          id: 'fu-101-1',
          note: 'Submitted refund ticket via Lufthansa portal; agent quoted 7-10 business days.',
          statusAfter: RefundStatus.Pending,
          createdAt: daysAgoIso(16),
        },
      ],
      lastUpdatedAt: daysAgoIso(16),
      createdAt: daysAgoIso(17),
    },
    {
      id: 'canc-102',
      bookingTitle: 'Hotel Arts Barcelona — 4 Nights Sea View Suite',
      provider: 'Booking.com',
      category: BookingCategory.Accommodation,
      bookingDate: daysOffsetDate(9),
      cancellationDate: daysOffsetDate(-12),
      referenceNumber: 'BKG-7741-902',
      expectedRefundAmount: 940.0,
      currency: 'EUR',
      status: RefundStatus.Disputed,
      notes: 'Property charged 1-night penalty despite free cancellation policy screenshot. Escalated to Booking.com billing team.',
      followUpHistory: [
        {
          id: 'fu-102-1',
          note: 'Uploaded policy PDF and original booking confirmation to support case #44891.',
          statusAfter: RefundStatus.Disputed,
          createdAt: daysAgoIso(11),
        },
      ],
      lastUpdatedAt: daysAgoIso(11),
      createdAt: daysAgoIso(12),
    },
    {
      id: 'canc-103',
      bookingTitle: 'Eurostar London St Pancras to Paris Gare du Nord',
      provider: 'Eurostar',
      category: BookingCategory.Rail,
      bookingDate: daysOffsetDate(4),
      cancellationDate: daysOffsetDate(-9),
      referenceNumber: 'EST-55219-UK',
      expectedRefundAmount: 248.0,
      currency: 'GBP',
      status: RefundStatus.Processing,
      notes: 'Train cancelled due to engineering works. Full cash refund requested instead of e-voucher.',
      followUpHistory: [
        {
          id: 'fu-103-1',
          note: 'Selected cash refund option on disruption portal; queued for BACS transfer.',
          statusAfter: RefundStatus.Processing,
          createdAt: daysAgoIso(9),
        },
      ],
      lastUpdatedAt: daysAgoIso(9),
      createdAt: daysAgoIso(9),
    },
    {
      id: 'canc-104',
      bookingTitle: 'Park Hyatt Tokyo — 3 Nights Deluxe King',
      provider: 'Expedia',
      category: BookingCategory.Accommodation,
      bookingDate: daysOffsetDate(26),
      cancellationDate: daysOffsetDate(-5),
      referenceNumber: 'EXP-9930144',
      expectedRefundAmount: 1120.0,
      currency: 'USD',
      status: RefundStatus.Processing,
      notes: 'Expedia confirmed full waiver with hotel front desk. Refund batch scheduled.',
      followUpHistory: [
        {
          id: 'fu-104-1',
          note: 'Live chat agent verified refund disbursement ID #RF-30198.',
          statusAfter: RefundStatus.Processing,
          createdAt: daysAgoIso(2),
        },
      ],
      lastUpdatedAt: daysAgoIso(2),
      createdAt: daysAgoIso(5),
    },
    {
      id: 'canc-105',
      bookingTitle: 'Monterey Jazz Festival — Weekend Arena Passes (x2)',
      provider: 'Ticketmaster',
      category: BookingCategory.Event,
      bookingDate: daysOffsetDate(-4),
      cancellationDate: daysOffsetDate(-6),
      referenceNumber: 'TM-EV-61840',
      expectedRefundAmount: 365.0,
      currency: 'USD',
      status: RefundStatus.Pending,
      notes: 'Rescheduled show date; opted in for full face-value refund via account order page.',
      followUpHistory: [
        {
          id: 'fu-105-1',
          note: 'Received confirmation receipt for refund queue.',
          statusAfter: RefundStatus.Pending,
          createdAt: daysAgoIso(4),
        },
      ],
      lastUpdatedAt: daysAgoIso(4),
      createdAt: daysAgoIso(6),
    },
    {
      id: 'canc-106',
      bookingTitle: 'Avis Compact SUV — Zurich Airport Pickup',
      provider: 'Avis',
      category: BookingCategory.CarRental,
      bookingDate: daysOffsetDate(-15),
      cancellationDate: daysOffsetDate(-22),
      referenceNumber: 'AVS-CH-20941',
      expectedRefundAmount: 412.5,
      currency: 'USD',
      status: RefundStatus.Refunded,
      notes: 'Prepaid reservation cancelled 5 days prior to pickup. Credited to Mastercard ending 4421.',
      followUpHistory: [
        {
          id: 'fu-106-1',
          note: 'Cancelled online and retained cancellation PDF.',
          statusAfter: RefundStatus.Processing,
          createdAt: daysAgoIso(22),
        },
        {
          id: 'fu-106-2',
          note: 'Confirmed $412.50 credit posted on monthly statement.',
          statusAfter: RefundStatus.Refunded,
          createdAt: daysAgoIso(14),
        },
      ],
      lastUpdatedAt: daysAgoIso(14),
      createdAt: daysAgoIso(22),
    },
    {
      id: 'canc-107',
      bookingTitle: 'Delta Air Lines DL-1892 Boston to Seattle',
      provider: 'Delta Air Lines',
      category: BookingCategory.Flight,
      bookingDate: daysOffsetDate(-20),
      cancellationDate: daysOffsetDate(-28),
      referenceNumber: 'DL-0062189442',
      expectedRefundAmount: 518.0,
      currency: 'USD',
      status: RefundStatus.Refunded,
      notes: 'Refundable Main Cabin ticket refunded cleanly back to original Amex card.',
      followUpHistory: [
        {
          id: 'fu-107-1',
          note: 'Refund posted in full to Amex statement.',
          statusAfter: RefundStatus.Refunded,
          createdAt: daysAgoIso(21),
        },
      ],
      lastUpdatedAt: daysAgoIso(21),
      createdAt: daysAgoIso(28),
    },
  ];
}
