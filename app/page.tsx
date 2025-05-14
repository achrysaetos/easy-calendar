/* eslint-disable @next/next/no-img-element */
'use client'; // Required for useState and event handlers

import React, { useState } from 'react';
import EventInput from '../components/EventInput';
import EventPreview from '../components/EventPreview';
import ActionButtons from '../components/ActionButtons';
import { ParsedEvent } from '../types/event'; // Import the ParsedEvent type

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
  const [error, setError] = useState<string | null>(null); // Added error state

  const handleEventSubmit = async () => {
    if (!eventText.trim()) return;
    setIsLoading(true);
    setParsedEvent(null);
    setError(null); // Clear previous errors

    try {
      const response = await fetch('/api/parse-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventText }),
      });

      if (!response.ok) {
        // Try to parse error from response body
        const errorData = await response.json().catch(() => null); // Gracefully handle non-JSON error responses
        throw new Error(errorData?.error || `API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // The API returns Omit<ParsedEvent, 'originalText'_,
      // so we add originalText back here.
      setParsedEvent({ ...data, originalText: eventText });

    } catch (err: any) {
      console.error("Error submitting event:", err);
      setError(err.message || "Failed to parse event. Please try again.");
      setParsedEvent(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock action handlers
  const handleAddToCalendar = () => console.log('Add to Calendar clicked', parsedEvent);
  const handleShare = () => console.log('Share Event clicked', parsedEvent);
  const handleRemind = () => console.log('Create Reminder clicked', parsedEvent);

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
              if (error) setError(null); // Clear error when user types
            }}
            onSubmit={handleEventSubmit}
          />
        </section>

        {isLoading && (
          <div className="text-center py-4">
            <p className="text-blue-600 animate-pulse">Parsing your event, please wait...</p>
          </div>
        )}

        {error && (
          <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        <section className="mb-6">
          <EventPreview event={parsedEvent} />
        </section>

        <section>
          <ActionButtons
            onAddToCalendar={handleAddToCalendar}
            onShare={handleShare}
            onRemind={handleRemind}
            disabled={!parsedEvent || isLoading}
          />
        </section>
      </div>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Easy Calendar. Your smart event solution.</p>
      </footer>
    </main>
  );
}
