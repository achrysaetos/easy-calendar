import { ParsedEvent } from '../types/event';
import {
  parse,
  addHours,
  isValid,
  parseISO,
} from 'date-fns';

const DEFAULT_EVENT_DURATION_HOURS = 1;

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

