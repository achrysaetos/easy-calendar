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

  const handleEventSubmit = async () => {
    if (!eventText.trim()) return;
    setIsLoading(true);
    setParsedEvent(null);
    // Simulate API call for now
    console.log("Submitting event text:", eventText);
    // In a real scenario, you would call your /api/parse-event endpoint here
    // For now, let's mock a response after a delay
    setTimeout(() => {
      const mockParsedEvent: ParsedEvent = {
        title: "Mock Event Title",
        date: "2024-07-20",
        time: "10:00 AM",
        location: "Mock Location",
        originalText: eventText, // Add originalText to mock event
      };
      setParsedEvent(mockParsedEvent);
      setIsLoading(false);
      console.log("Mock event parsed:", mockParsedEvent);
    }, 2000);
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
            onChange={setEventText}
            onSubmit={handleEventSubmit}
          />
        </section>

        {isLoading && (
          <div className="text-center py-4">
            <p className="text-blue-600">Parsing your event, please wait...</p>
            {/* You can add a spinner icon here */}
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
