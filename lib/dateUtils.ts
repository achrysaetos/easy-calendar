import { ParsedEvent } from '../types/event';
import {
  parse,
  setHours,
  setMinutes,
  setSeconds,
  addHours,
  isDate,
  isValid,
  parseISO,
  format
} from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz'; // For timezone handling

const DEFAULT_EVENT_DURATION_HOURS = 1;

// Basic time string parser (e.g., "10:00 AM", "3pm", "14:30")
// This is a very simplified parser and can be significantly improved.
function parseTime(timeString: string): { hours: number; minutes: number } | null {
  if (!timeString) return null;
  let normalizedTimeString = timeString.toLowerCase().replace(/\s+/g, '');

  // Handle "noon" and "midnight"
  if (normalizedTimeString === 'noon') return { hours: 12, minutes: 0 };
  if (normalizedTimeString === 'midnight') return { hours: 0, minutes: 0 };

  // Try to match HH:mm AM/PM or H AM/PM
  let match = normalizedTimeString.match(/(\d{1,2})(?:[:\.](\d{2}))?(am|pm)?/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3];

    if (isNaN(hours) || isNaN(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null; // Basic validation

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0; // Midnight case (12 AM)
    if (hours === 24 && ampm ==='pm') hours = 12; // Noon case (12 PM)

    return { hours, minutes };
  }
  return null;
}

/**
 * Attempts to parse start and end date-time strings from a ParsedEvent into Date objects.
 * Handles a default duration if the end time is not provided.
 *
 * @param parsedEvent The event object with startDateTimeString and optionally endDateTimeString from AI.
 * @param referenceDate The date to resolve relative terms against. Defaults to now.
 * @returns An object with start and end Date objects, or null if parsing fails.
 */
export function parseEventDateTime(
  parsedEvent: ParsedEvent,
  referenceDate: Date = new Date() // referenceDate might be less critical if AI provides absolute dates
): { start: Date; end: Date } | null {
  if (!parsedEvent.startDateTimeString) {
    console.warn('parseEventDateTime: Missing startDateTimeString from parsedEvent', parsedEvent);
    return null;
  }

  let startDateTime: Date;
  let endDateTime: Date;

  // Attempt to parse the startDateTimeString.
  // AI is expected to return "YYYY-MM-DD HH:mm" or similar that parseISO or parse can handle.
  // Using parse with a reference date can help with more formats, but parseISO is stricter.
  startDateTime = parseISO(parsedEvent.startDateTimeString); // Try ISO first
  if (!isValid(startDateTime)) {
    // Fallback to a more flexible parse if ISO fails. This requires careful format string management.
    // Example: startDateTime = parse(parsedEvent.startDateTimeString, "yyyy-MM-dd HH:mm", referenceDate);
    // For now, we'll assume AI is somewhat consistent or use a library that handles varied inputs better for this fallback.
    // A simple fallback trying a common format, assuming referenceDate helps.
    startDateTime = parse(parsedEvent.startDateTimeString, "yyyy-MM-dd HH:mm", referenceDate);
    if (!isValid(startDateTime)) {
        // A second common format for dates like "May 20 2024 10:00"
        startDateTime = parse(parsedEvent.startDateTimeString, "MMM d yyyy HH:mm", referenceDate);
         if (!isValid(startDateTime)) {
            console.error(`Failed to parse startDateTimeString: ${parsedEvent.startDateTimeString}`);
            return null;
        }
    }
  }

  // Attempt to parse or calculate the endDateTime.
  if (parsedEvent.endDateTimeString) {
    endDateTime = parseISO(parsedEvent.endDateTimeString);
    if (!isValid(endDateTime)) {
      // Fallback for endDateTimeString as well
      endDateTime = parse(parsedEvent.endDateTimeString, "yyyy-MM-dd HH:mm", referenceDate);
      if (!isValid(endDateTime)) {
        endDateTime = parse(parsedEvent.endDateTimeString, "MMM d yyyy HH:mm", referenceDate);
      }
    }
    // If still not valid after trying to parse, or if end is before start, revert to default duration
    if (!isValid(endDateTime) || endDateTime < startDateTime) {
      if(!isValid(endDateTime)){
          console.warn(`Invalid endDateTimeString: ${parsedEvent.endDateTimeString}. Defaulting to duration.`);
      } else {
          console.warn(`End time ${parsedEvent.endDateTimeString} is before start time ${parsedEvent.startDateTimeString}. Defaulting to duration.`);
      }
      endDateTime = addHours(startDateTime, DEFAULT_EVENT_DURATION_HOURS);
    }
  } else {
    // Default duration if no endDateTimeString is provided
    endDateTime = addHours(startDateTime, DEFAULT_EVENT_DURATION_HOURS);
  }

  if (!isValid(startDateTime) || !isValid(endDateTime)) {
    console.error('Constructed startDateTime or endDateTime is invalid', { startDateTime, endDateTime });
    return null;
  }
  
  // Ensure end is not before start, if it somehow passed previous checks (e.g. AI gave valid but reversed times)
  if (endDateTime < startDateTime) {
    console.warn('Final check: End time is before start time. Adjusting end time to default duration from start.');
    endDateTime = addHours(startDateTime, DEFAULT_EVENT_DURATION_HOURS);
  }

  return { start: startDateTime, end: endDateTime };
}

// --- Example Usage (for testing, can be removed) ---
/*
const testEvents: ParsedEvent[] = [
  { title: 'Event 1', date: '2024-08-15', time: '10:00 AM', location: 'Office', originalText: '' },
  { title: 'Event 2', date: 'tomorrow', time: '2:30pm', location: 'Cafe', originalText: '' },
  { title: 'Event 3', date: 'next friday', time: 'noon', location: 'Park', originalText: '' },
  { title: 'Event 4', date: 'August 20, 2024', time: '7PM', location: 'Home', originalText: '' },
  { title: 'Event 5', date: 'Invalid Date', time: '10:00 AM', location: '-', originalText: '' },
  { title: 'Event 6', date: '2024-08-25', time: 'Invalid Time', location: '-', originalText: '' },
  { title: 'Event 7', date: 'today', time: 'midnight', location: '-', originalText: '' },
];

console.log("\n--- Date Parsing Tests ---");
testEvents.forEach(event => {
  const parsedDates = parseEventDateTime(event);
  if (parsedDates) {
    console.log(
      `Event: "${event.title}" (${event.date} ${event.time}) -> Start: ${parsedDates.start.toLocaleString()}, End: ${parsedDates.end.toLocaleString()}`
    );
  } else {
    console.log(`Event: "${event.title}" (${event.date} ${event.time}) -> Failed to parse`);
  }
});
*/ 