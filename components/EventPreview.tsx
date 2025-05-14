import React from 'react';
import { ParsedEvent } from '../types/event'; // Import from centralized location

// Define ParsedEvent type here or import from types/event.ts later
// interface ParsedEvent { <-- REMOVE THIS BLOCK
//   title: string;
//   date: string;
//   time: string;
//   location: string;
//   // originalText: string; // We'll add this when integrating with the parser
// }

interface EventPreviewProps {
  event: ParsedEvent | null;
  // We can add conflict information here later
  // conflicts: CalendarEvent[] | null;
}

const EventPreview: React.FC<EventPreviewProps> = ({ event }) => {
  if (!event) {
    return (
      <div className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-500">
        Parsed event details will appear here once you submit an event.
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white shadow">
      <h2 className="text-xl font-semibold mb-3">Event Preview</h2>
      <div className="space-y-2">
        <p><strong>Title:</strong> {event.title}</p>
        <p><strong>Date:</strong> {event.date}</p>
        <p><strong>Time:</strong> {event.time}</p>
        <p><strong>Location:</strong> {event.location}</p>
        {event.originalText && <p className="mt-2 text-sm text-gray-500"><strong>Original:</strong> <em>{event.originalText}</em></p>}
      </div>
      {/* Placeholder for conflict information */}
      {/* {conflicts && conflicts.length > 0 && (
        <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <h3 className="font-bold">Conflicts Detected!</h3>
          <ul>
            {conflicts.map(conflict => <li key={conflict.id}>{conflict.title} at {conflict.start.toLocaleString()}</li>)}
          </ul>
        </div>
      )} */}
    </div>
  );
};

export default EventPreview; 