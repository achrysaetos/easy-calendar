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
 * Attempts to parse date and time strings from a ParsedEvent into Date objects.
 * This is a simplified implementation and will need robust error handling and more advanced parsing logic
 * for varied natural language date/time formats (e.g., "next Friday", "tomorrow evening").
 *
 * @param parsedEvent The event object with date and time strings from AI.
 * @param referenceDate The date to resolve relative terms like "tomorrow" against. Defaults to now.
 * @returns An object with start and end Date objects, or null if parsing fails.
 */
export function parseEventDateTime(
  parsedEvent: ParsedEvent,
  referenceDate: Date = new Date()
): { start: Date; end: Date } | null {
  if (!parsedEvent.date || !parsedEvent.time) {
    // If AI couldn't extract date or time, we can't form a valid Date object here.
    // We could potentially try to parse from originalText if one is missing,
    // but that makes this function much more complex.
    console.warn('parseEventDateTime: Missing date or time string from parsedEvent', parsedEvent);
    return null;
  }

  let startDate: Date;

  // Attempt to parse the date string.
  // This is highly simplistic. `date-fns/parse` with multiple formats, or a more
  // dedicated NLP date library would be better for production.
  try {
    // First, try to parse as ISO (e.g., "2024-07-28")
    let potentialDate = parseISO(parsedEvent.date);
    if (isValid(potentialDate)) {
      startDate = potentialDate;
    } else {
      // Attempt common formats like "MM/dd/yyyy", "d MMMM yyyy", etc.
      // For simplicity, we'll just try one basic format. This needs expansion.
      // The referenceDate helps `parse` interpret ambiguous dates like "May 5th"
      // (it will use the year from referenceDate).
      const formatsToTry = [
        'MM/dd/yyyy',
        'M/d/yy',
        'yyyy-MM-dd',
        'MMMM d, yyyy',
        'MMM d, yyyy',
        'MMMM d',
        'MMM d',
        // Add more formats as needed
      ];
      let parsed = false;
      for (const fmt of formatsToTry) {
        potentialDate = parse(parsedEvent.date, fmt, referenceDate);
        if (isValid(potentialDate)) {
          startDate = potentialDate;
          parsed = true;
          break;
        }
      }
      if (!parsed) {
         // Handle relative dates like "tomorrow", "next Friday" - VERY basic
        const lowerDate = parsedEvent.date.toLowerCase();
        startDate = new Date(referenceDate); // Start with today as reference
        startDate = setHours(startDate, 0); // Normalize to start of day
        startDate = setMinutes(startDate, 0);
        startDate = setSeconds(startDate, 0);

        if (lowerDate === 'today') {
          // Already set to today
        } else if (lowerDate === 'tomorrow') {
          startDate.setDate(startDate.getDate() + 1);
        } else if (lowerDate.includes('next friday')) { // Highly simplistic
          let dayOfWeek = 5; // Friday
          startDate.setDate(startDate.getDate() + (dayOfWeek + 7 - startDate.getDay()) % 7);
          if (startDate <= referenceDate) startDate.setDate(startDate.getDate() + 7); // ensure it's *next*
        } else {
          console.error(`Failed to parse date string: ${parsedEvent.date}`);
          return null;
        }
      }
    }
  } catch (error) {
    console.error(`Error parsing date string '${parsedEvent.date}':`, error);
    return null;
  }

  // Parse the time string
  const timeInfo = parseTime(parsedEvent.time);
  if (!timeInfo) {
    console.error(`Failed to parse time string: ${parsedEvent.time}`);
    return null;
  }

  // Combine date and time
  // It's crucial to handle timezones correctly. Assuming the parsed times are local.
  let startDateTime = setHours(startDate, timeInfo.hours);
  startDateTime = setMinutes(startDateTime, timeInfo.minutes);
  startDateTime = setSeconds(startDateTime, 0); // Clear seconds for consistency

  if (!isValid(startDateTime)) {
    console.error('Constructed startDateTime is invalid', startDateTime);
    return null;
  }

  // Assume a default duration if no end time is parsed (e.g., 1 hour)
  const endDateTime = addHours(startDateTime, DEFAULT_EVENT_DURATION_HOURS);

  // Consider user's timezone. For now, assume all dates are in the system's local timezone.
  // For production, one might store UTC and convert to user's timezone for display.

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