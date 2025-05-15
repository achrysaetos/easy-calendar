export interface ParsedEvent {
  title: string;
  startDateTimeString: string; // e.g., "2024-05-20 10:00" or "next Monday at 3pm"
  endDateTimeString?: string;   // Optional, AI might provide it or we calculate it
  location: string;
  originalText: string; // The original input text from the user
}

export interface CalendarEvent {
  id: string; // Unique identifier for the event
  title: string;
  start: Date; // JavaScript Date object for start time
  end: Date;   // JavaScript Date object for end time
  location?: string; // Optional location
  // We might add other properties like description, attendees, etc. later
} 