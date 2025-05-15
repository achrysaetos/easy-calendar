import { CalendarEvent, ParsedEvent } from '../types/event';
import { isWithinInterval, parseISO } from 'date-fns'; // We might not need parseISO here if dates are already Date objects
import { parseEventDateTime } from './dateUtils'; // Corrected import path

/**
 * Checks if two date ranges overlap.
 * Assumes start and end are valid Date objects and start <= end.
 */
function doDateRangesOverlap(
  startA: Date, endA: Date,
  startB: Date, endB: Date
): boolean {
  // Overlap exists if A starts before B ends AND A ends after B starts.
  return startA < endB && endA > startB;
}

/**
 * Checks a new event against a list of existing calendar events for conflicts.
 *
 * @param newEventStart The start date/time of the new event.
 * @param newEventEnd The end date/time of the new event.
 * @param existingEvents An array of existing calendar events to check against.
 * @returns An array of existing events that conflict with the new event. Returns an empty array if no conflicts.
 */
export function checkConflicts(
  newEventStart: Date,
  newEventEnd: Date,
  existingEvents: CalendarEvent[]
): CalendarEvent[] {
  if (!(newEventStart instanceof Date) || !(newEventEnd instanceof Date) || newEventStart >= newEventEnd) {
    console.error('Invalid new event dates provided to checkConflicts');
    return []; // Or throw an error
  }

  const conflictingEvents: CalendarEvent[] = [];

  for (const existingEvent of existingEvents) {
    if (!(existingEvent.start instanceof Date) || !(existingEvent.end instanceof Date) || existingEvent.start >= existingEvent.end) {
      console.warn(`Skipping existing event with invalid dates: ${existingEvent.title}`);
      continue;
    }

    if (doDateRangesOverlap(newEventStart, newEventEnd, existingEvent.start, existingEvent.end)) {
      conflictingEvents.push(existingEvent);
    }
  }

  return conflictingEvents;
}

/**
 * Checks if a new parsed event is an exact duplicate of any existing calendar event.
 * An exact duplicate has the same title, start time, end time, and location.
 *
 * @param parsedEvent The new event parsed from user input.
 * @param existingEvents An array of existing calendar events.
 * @returns The existing CalendarEvent if an exact match is found, otherwise null.
 */
export function findExactMatch(
  parsedEvent: ParsedEvent,
  existingEvents: CalendarEvent[]
): CalendarEvent | null {
  if (!parsedEvent) return null;

  const newEventTimes = parseEventDateTime(parsedEvent);
  if (!newEventTimes) {
    // If the new event's date/time can't be parsed, it can't be an exact match.
    console.warn("findExactMatch: Could not parse date/time for the new event.", parsedEvent);
    return null;
  }

  for (const existingEvent of existingEvents) {
    // Normalize locations for comparison (treat empty, null, undefined as same)
    const newEventLocation = parsedEvent.location?.trim() || "";
    const existingEventLocation = existingEvent.location?.trim() || "";

    if (
      parsedEvent.title === existingEvent.title &&
      newEventTimes.start.getTime() === existingEvent.start.getTime() &&
      newEventTimes.end.getTime() === existingEvent.end.getTime() &&
      newEventLocation === existingEventLocation
    ) {
      return existingEvent; // Found an exact match
    }
  }

  return null; // No exact match found
}

// Example Usage (can be kept for testing or removed):
/*
import { mockCalendarEvents } from '../data/mockCalendar';

// Test case 1: An event that conflicts with "Team Meeting"
const testEvent1Start = new Date(mockCalendarEvents[0].start); // Same start as Team Meeting
testEvent1Start.setMinutes(testEvent1Start.getMinutes() + 15); // e.g., 10:15 AM if Team Meeting is 10:00 AM
const testEvent1End = new Date(testEvent1Start);
testEvent1End.setHours(testEvent1End.getHours() + 1); // 1 hour duration, e.g., ends 11:15 AM

const conflicts1 = checkConflicts(testEvent1Start, testEvent1End, mockCalendarEvents);
console.log("Test Case 1 Conflicts (should include Team Meeting and Dentist Appointment if dates align):");
conflicts1.forEach(event => console.log(` - ${event.title} from ${event.start.toLocaleTimeString()} to ${event.end.toLocaleTimeString()}`));

// Test case 2: An event that does not conflict
const testEvent2Start = new Date();
testEvent2Start.setDate(testEvent2Start.getDate() + 5); // 5 days from now
testEvent2Start.setHours(14, 0, 0, 0); // 2 PM
const testEvent2End = new Date(testEvent2Start);
testEvent2End.setHours(testEvent2End.getHours() + 2); // 2 hour duration

const conflicts2 = checkConflicts(testEvent2Start, testEvent2End, mockCalendarEvents);
console.log("\nTest Case 2 Conflicts (should be empty):");
conflicts2.forEach(event => console.log(` - ${event.title}`));
if (conflicts2.length === 0) console.log(" (No conflicts)");

// Test case 3: New event that fully contains an existing event
const containingEventStart = new Date(mockCalendarEvents[0].start);
containingEventStart.setHours(containingEventStart.getHours() - 1); // Starts 1 hour before Team Meeting
const containingEventEnd = new Date(mockCalendarEvents[0].end);
containingEventEnd.setHours(containingEventEnd.getHours() + 1); // Ends 1 hour after Team Meeting

const conflicts3 = checkConflicts(containingEventStart, containingEventEnd, mockCalendarEvents);
console.log("\nTest Case 3 Conflicts (should include Team Meeting and Dentist Appointment):");
conflicts3.forEach(event => console.log(` - ${event.title} from ${event.start.toLocaleTimeString()} to ${event.end.toLocaleTimeString()}`));

// Test case 4: New event is fully contained by an existing event
// For this, we'd need an existing event like 9 AM - 5 PM
// Let's use the Dentist Appointment (10:30 - 11:00 for example)
// and try to fit something inside it or similar to it.
const containedEventStart = new Date(mockCalendarEvents[3].start);
containedEventStart.setMinutes(containedEventStart.getMinutes() + 5); // e.g. 10:35
const containedEventEnd = new Date(mockCalendarEvents[3].end);
containedEventEnd.setMinutes(containedEventEnd.getMinutes() - 5); // e.g. 10:55

if (containedEventStart < containedEventEnd) { // Ensure valid range
    const conflicts4 = checkConflicts(containedEventStart, containedEventEnd, mockCalendarEvents);
    console.log("\nTest Case 4 Conflicts (should include Dentist Appointment and possibly Team Meeting):");
    conflicts4.forEach(event => console.log(` - ${event.title} from ${event.start.toLocaleTimeString()} to ${event.end.toLocaleTimeString()}`));
}
*/ 