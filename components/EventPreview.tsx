import React from 'react';
import { ParsedEvent, CalendarEvent } from '../types/event'; // Import CalendarEvent
import { format } from 'date-fns'; // For formatting dates in conflict display

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
  conflicts: CalendarEvent[]; // Add conflicts prop
}

const EventPreview: React.FC<EventPreviewProps> = ({ event, conflicts }) => {
  if (!event) {
    return (
      <div className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-500">
        Parsed event details will appear here once you submit an event.
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-3 text-gray-700">Event Preview</h2>
      <div className="space-y-1 text-gray-600">
        <p><strong>Title:</strong> {event.title || <span className="text-gray-400">N/A</span>}</p>
        <p><strong>Date:</strong> {event.date || <span className="text-gray-400">N/A</span>}</p>
        <p><strong>Time:</strong> {event.time || <span className="text-gray-400">N/A</span>}</p>
        <p><strong>Location:</strong> {event.location || <span className="text-gray-400">N/A</span>}</p>
        {event.originalText && <p className="mt-2 text-xs text-gray-400"><strong>Original:</strong> <em>{event.originalText}</em></p>}
      </div>

      {conflicts && conflicts.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-md">
          <h3 className="text-md font-semibold mb-2">⚠️ Potential Conflicts Detected!</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {conflicts.map(conflict => (
              <li key={conflict.id}>
                <strong>{conflict.title}</strong>
                {conflict.location && <span className="text-xs"> ({conflict.location})</span>}
                <br />
                <span className="text-xs">
                  {format(conflict.start, 'MMM d, h:mm a')} - {format(conflict.end, 'h:mm a')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EventPreview; 