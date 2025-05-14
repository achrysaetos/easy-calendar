export interface ParsedEvent {
  title: string;
  date: string; // Will likely be a string from AI, e.g., "YYYY-MM-DD" or "next Friday"
  time: string; // Will also be a string, e.g., "HH:mm AM/PM" or "noon"
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