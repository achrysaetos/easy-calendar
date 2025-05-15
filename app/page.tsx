/* eslint-disable @next/next/no-img-element */
'use client'; // Required for useState and event handlers

import React, { useState, useEffect } from 'react';
import EventInput from '../components/EventInput';
import EventPreview from '../components/EventPreview';
import ActionButtons from '../components/ActionButtons';
import { ParsedEvent, CalendarEvent, Reminder } from '../types/event'; // Add CalendarEvent and Reminder
import { mockCalendarEvents } from '../data/mockCalendar';
import { parseEventDateTime } from '../lib/dateUtils';
import { checkConflicts, findExactMatch } from '../lib/calendarUtils'; // Added findExactMatch
import { format } from 'date-fns'; // For formatting dates in share text

export default function Home() {
  const [eventText, setEventText] = useState('');
  const [parsedEvent, setParsedEvent] = useState<ParsedEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<CalendarEvent[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]); // New state for reminders

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

      if (currentParsedEvent.startDateTimeString) {
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
          console.warn("Could not parse startDateTimeString from AI response for conflict preview.", currentParsedEvent);
          setConflicts([]);
        }
      } else {
        console.warn("AI response did not include a startDateTimeString.", currentParsedEvent);
        setConflicts([]);
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
    setFeedbackMessage(null); // Clear previous feedback

    const eventTimeDetails = parseEventDateTime(parsedEvent);
    if (!eventTimeDetails) {
      setFeedbackMessage(
        `Could not determine a specific date/time for "${parsedEvent.title}" to add to calendar. Please ensure date and time are clear.`
      );
      console.warn("Failed to parse date/time for adding to calendar:", parsedEvent);
      return;
    }

    // Check for exact match first
    const exactMatch = findExactMatch(parsedEvent, calendarEvents);
    if (exactMatch) {
      setFeedbackMessage(
        `This event has already been added to your calendar.`
      );
      // Optionally, you might want to show this specific conflict instead of general time conflicts
      // For now, clearing conflicts as the primary issue is the exact match.
      setConflicts([]); 
      console.warn("Attempted to add an exact duplicate event:", parsedEvent, exactMatch);
      return;
    }

    // Check for time-based conflicts (for warning purposes)
    const timeConflicts = checkConflicts(eventTimeDetails.start, eventTimeDetails.end, calendarEvents);
    setConflicts(timeConflicts); // Update conflicts state to show warnings in EventPreview

    if (timeConflicts.length > 0) {
      console.warn(
        `Adding event "${parsedEvent.title}" with time conflicts:`,
        timeConflicts.map(c => `${c.title} @ ${format(c.start, 'Pp')}`)
      );
      // Warning is shown via EventPreview due to setConflicts above.
      // User can still add, so no return here based on timeConflicts.
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
    
    // Clear input for next event, but keep parsedEvent and its conflicts for further actions
    setEventText('');
    // setParsedEvent(null); // Keep parsedEvent to allow further actions
    // setConflicts([]); // Keep conflicts related to the parsedEvent
  };

  const handleShare = () => {
    if (!parsedEvent) return;

    const eventTimeDetails = parseEventDateTime(parsedEvent);

    let shareText = `Event: ${parsedEvent.title}`;
    if (eventTimeDetails) {
      shareText += ` on ${format(eventTimeDetails.start, 'MMM d, yyyy' )}`;
      shareText += ` from ${format(eventTimeDetails.start, 'hh:mm a' )}`;
      shareText += ` to ${format(eventTimeDetails.end, 'hh:mm a' )}`;
    } else if (parsedEvent.startDateTimeString) {
      shareText += ` (Details: ${parsedEvent.startDateTimeString}`;
      if(parsedEvent.endDateTimeString) shareText += ` to ${parsedEvent.endDateTimeString}`;
      shareText += ")";
    }
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
      const newReminder: Reminder = {
        id: Date.now().toString(),
        eventTitle: parsedEvent.title || "Untitled Event",
        reminderTime: reminderTime,
        originalEventDetails: parsedEvent,
      };
      setReminders(prevReminders => [...prevReminders, newReminder]);
      const message = `Reminder set for "${newReminder.eventTitle}" (${newReminder.reminderTime}).`;
      console.log(message, parsedEvent);
      setFeedbackMessage(message);
    } else {
      setFeedbackMessage("Reminder creation cancelled.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 md:p-24 bg-gray-50">
      <header className="mb-10 text-center">
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
          <div className="text-center pb-6">
            <p className="text-blue-600 animate-pulse">Generating details...</p>
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

        {!isLoading && (
          <section className="mb-6">
            <EventPreview event={parsedEvent} conflicts={conflicts} />
          </section>
        )}

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

        {/* Display section for all reminders */}
        {reminders.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Your Reminders</h2>
            <ul className="space-y-3">
              {reminders.map(reminder => (
                <li key={reminder.id} className="p-3 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
                  <h3 className="font-medium text-gray-800">Reminder for: {reminder.eventTitle}</h3>
                  <p className="text-sm text-gray-600">
                    When: {reminder.reminderTime}
                  </p>
                  {/* Optionally, display more details from reminder.originalEventDetails if needed */}
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
