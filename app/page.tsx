/* eslint-disable @next/next/no-img-element */
'use client'; // Required for useState and event handlers

import React, { useState, useEffect } from 'react';
import EventInput from '../components/EventInput';
import EventPreview from '../components/EventPreview';
import ActionButtons from '../components/ActionButtons';
import { ParsedEvent, CalendarEvent } from '../types/event'; // Add CalendarEvent
import { mockCalendarEvents } from '../data/mockCalendar';
import { parseEventDateTime } from '../lib/dateUtils';
import { checkConflicts } from '../lib/calendarUtils';
import { format } from 'date-fns'; // For formatting dates in share text

// Temporary ParsedEvent type - will move to types/event.ts
// interface ParsedEvent {  <-- REMOVE THIS BLOCK
//   title: string;
//   date: string;
//   time: string;
//   location: string;
//   // originalText: string;
// }

export default function Home() {
  const [eventText, setEventText] = useState('');
  const [parsedEvent, setParsedEvent] = useState<ParsedEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<CalendarEvent[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    setCalendarEvents(mockCalendarEvents);
    console.log("Initial calendar events loaded:", mockCalendarEvents);
  }, []);

  const handleEventSubmit = async () => {
    if (!eventText.trim()) return;
    setIsLoading(true);
    setParsedEvent(null);
    setError(null);
    setConflicts([]);
    setFeedbackMessage(null);

    try {
      const response = await fetch('/api/parse-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `API Error: ${response.status} ${response.statusText}`);
      }

      const dataFromApi = await response.json();
      const currentParsedEvent: ParsedEvent = { ...dataFromApi, originalText: eventText };
      setParsedEvent(currentParsedEvent);

      if (currentParsedEvent.date && currentParsedEvent.time) {
        const dateTimeRange = parseEventDateTime(currentParsedEvent);
        if (dateTimeRange) {
          const foundConflicts = checkConflicts(dateTimeRange.start, dateTimeRange.end, calendarEvents);
          setConflicts(foundConflicts);
          console.log("Parsed Event for Preview:", currentParsedEvent);
          if (foundConflicts.length > 0) {
            console.log("Conflicts found for preview:", foundConflicts);
          } else {
            console.log("No conflicts found for preview.");
          }
        } else {
          console.warn("Could not parse date/time from AI response for conflict preview.", currentParsedEvent);
          setConflicts([]);
        }
      }
    } catch (err) {
      let errorMessage = "Failed to parse event. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error("Error submitting event:", err);
      setError(errorMessage);
      setParsedEvent(null);
      setConflicts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCalendar = () => {
    if (!parsedEvent) {
      setFeedbackMessage("No event to add. Please parse an event first.");
      return;
    }
    setFeedbackMessage(null);

    const eventTimeDetails = parseEventDateTime(parsedEvent);
    if (!eventTimeDetails) {
      setFeedbackMessage(
        `Could not determine a specific date/time for "${parsedEvent.title}" to add to calendar. Please ensure date and time are clear.`
      );
      console.warn("Failed to parse date/time for adding to calendar:", parsedEvent);
      console.log("Current calendar events (add failed - parse error):", calendarEvents);
      return;
    }

    const currentConflicts = checkConflicts(eventTimeDetails.start, eventTimeDetails.end, calendarEvents);

    if (currentConflicts.length > 0) {
      setFeedbackMessage(
        `Cannot add event: "${parsedEvent.title}" due to conflicts with your existing calendar. Please resolve them first.`
      );
      setConflicts(currentConflicts);
      console.warn("Attempted to add event with conflicts:", parsedEvent, currentConflicts);
      console.log("Current calendar events (add failed - conflict):", calendarEvents);
      return;
    }

    const newCalendarEntry: CalendarEvent = {
      id: Date.now().toString(),
      title: parsedEvent.title || "Untitled Event",
      start: eventTimeDetails.start,
      end: eventTimeDetails.end,
      location: parsedEvent.location || undefined,
    };
    let updatedEvents: CalendarEvent[] = [];
    setCalendarEvents(prevEvents => {
      updatedEvents = [...prevEvents, newCalendarEntry].sort((a,b) => a.start.getTime() - b.start.getTime());
      console.log("Event added. Updated calendar events:", updatedEvents);
      return updatedEvents;
    });
    setFeedbackMessage(`"${newCalendarEntry.title}" added to your calendar!`);
    
    setEventText('');
    setParsedEvent(null);
    setConflicts([]);
  };

  const handleShare = () => {
    if (!parsedEvent) return;
    let shareText = `Event: ${parsedEvent.title}`;
    if (parsedEvent.date) shareText += ` on ${parsedEvent.date}`;
    if (parsedEvent.time) shareText += ` at ${parsedEvent.time}`;
    if (parsedEvent.location) shareText += ` at ${parsedEvent.location}`;
    shareText += ". (Sent via Easy Calendar Assistant)";

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText)
        .then(() => setFeedbackMessage("Event details copied to clipboard!"))
        .catch(() => { alert(`Share this event:\n\n${shareText}`); setFeedbackMessage("Event details ready to share (see alert)."); });
    } else {
      alert(`Share this event:\n\n${shareText}`);
      setFeedbackMessage("Event details ready to share (see alert).");
    }
  };

  const handleRemind = () => {
    if (!parsedEvent) return;
    const reminderTime = prompt(
      `When would you like a reminder for "${parsedEvent.title}"?\n(e.g., "1 hour before", "The night before", "May 5 at 9am")`,
      "1 hour before"
    );
    if (reminderTime) {
      const message = `Reminder set for "${parsedEvent.title}" (${reminderTime}). (Simulated)`;
      console.log(message, parsedEvent);
      setFeedbackMessage(message);
    } else {
      setFeedbackMessage("Reminder creation cancelled.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 md:p-24 bg-gray-50">
      <header className="mb-10 text-center">
        <img src="/logo.png" alt="Easy Calendar Logo" className="h-16 w-auto mx-auto mb-2" /> {/* Assuming you might add a logo */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">AI Calendar Assistant</h1>
        <p className="text-gray-600 mt-1">Paste your event details below and let AI do the rest!</p>
      </header>

      <div className="w-full max-w-lg lg:max-w-xl bg-white shadow-xl rounded-lg p-6 sm:p-8">
        <section className="mb-6">
          <EventInput
            value={eventText}
            onChange={(value) => {
              setEventText(value);
              if (error) setError(null);
              if (feedbackMessage) setFeedbackMessage(null);
            }}
            onSubmit={handleEventSubmit}
          />
        </section>

        {isLoading && (
          <div className="text-center py-4">
            <p className="text-blue-600 animate-pulse">Parsing event...</p>
          </div>
        )}

        {error && (
          <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        {feedbackMessage && (
          <div className={`my-4 p-3 border rounded-md text-sm ${feedbackMessage.includes("Cannot add event") || feedbackMessage.includes("Could not determine") || feedbackMessage.includes("No event to add") ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : 'bg-green-100 border-green-400 text-green-700'}`}>
            <p>{feedbackMessage}</p>
          </div>
        )}

        <section className="mb-6">
          <EventPreview event={parsedEvent} conflicts={conflicts} />
        </section>

        <section className="mb-8">
          <ActionButtons
            onAddToCalendar={handleAddToCalendar}
            onShare={handleShare}
            onRemind={handleRemind}
            disabled={!parsedEvent || isLoading}
          />
        </section>

        {/* Display section for all calendar events */}
        {calendarEvents.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Your Calendar Events</h2>
            <ul className="space-y-3">
              {calendarEvents.map(calEvent => (
                <li key={calEvent.id} className="p-3 bg-gray-50 border border-gray-200 rounded-md shadow-sm">
                  <h3 className="font-medium text-gray-800">{calEvent.title}</h3>
                  <p className="text-sm text-gray-600">
                    {format(calEvent.start, 'EEE, MMM d, yyyy hh:mm a')} - {format(calEvent.end, 'hh:mm a')}
                  </p>
                  {calEvent.location && <p className="text-xs text-gray-500">Location: {calEvent.location}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Easy Calendar. Your smart event solution.</p>
      </footer>
    </main>
  );
}
