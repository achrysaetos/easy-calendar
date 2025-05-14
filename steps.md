# Step-by-Step Plan: AI-Powered Calendar Assistant

This document outlines the steps to build a web prototype that parses natural language event descriptions, checks for conflicts, and allows users to add events to their calendar, share them, or create reminders. The application will be built using React, TypeScript, and Next.js.

## Phase 1: Project Setup & Basic UI

1.  **Install Dependencies:**
    *   Install necessary libraries:
        ```bash
        npm install openai date-fns # For OpenAI API and date/time manipulation
        npm install lucide-react # For icons (optional, but nice for UI)
        # Consider a lightweight CSS framework or utility classes if desired, e.g., Tailwind CSS
        # npm install -D tailwindcss postcss autoprefixer
        # npx tailwindcss init -p
        ```

2.  **Basic Page Structure (`pages/index.tsx`):**
    *   Create a main application component.
    *   Set up a basic layout:
        *   Header/Title for the application.
        *   An area for the input field.
        *   An area to display the parsed event preview.
        *   An area for action buttons.

3.  **Input Component (`components/EventInput.tsx`):**
    *   Create a controlled React component for the text input field.
    *   Props: `value: string`, `onChange: (value: string) => void`, `onSubmit: () => void`.
    *   Include a submit button or handle submission on Enter key press.

4.  **Event Preview Component (`components/EventPreview.tsx`):**
    *   Create a component to display the parsed event details (title, date, time, location).
    *   Props: `event: ParsedEvent | null` (define `ParsedEvent` type later).
    *   Initially, it can show a placeholder or be hidden.

5.  **Action Buttons Component (`components/ActionButtons.tsx`):**
    *   Create a component for "Add to Calendar," "Share Event," and "Create Reminder" buttons.
    *   Props: `onAddToCalendar: () => void`, `onShare: () => void`, `onRemind: () => void`, `disabled: boolean` (buttons should be disabled if no event is parsed).

6.  **Styling:**
    *   Apply basic CSS (e.g., using CSS Modules, global CSS, or Tailwind CSS if installed) for a clean and usable interface. Focus on clarity and ease of use.

## Phase 2: AI Event Parsing

1.  **Define Data Structures (`types/event.ts`):**
    *   Create TypeScript interfaces for:
        *   `ParsedEvent`: `{ title: string; date: string; time: string; location: string; originalText: string; }`
        *   `CalendarEvent`: `{ id: string; title: string; start: Date; end: Date; location?: string; }` (for mock calendar data)

2.  **OpenAI API Key Setup:**
    *   Sign up for an OpenAI API key.
    *   Store the API key securely using environment variables (`.env.local`):
        ```
        OPENAI_API_KEY=your_api_key_here
        ```
    *   Ensure `.env.local` is in `.gitignore`.

3.  **Next.js API Route for Parsing (`pages/api/parse-event.ts`):**
    *   Create an API route to handle requests to the OpenAI API.
    *   This route will receive the natural language text from the frontend.
    *   Use the `openai` npm package to interact with the GPT model (e.g., `gpt-3.5-turbo` or `gpt-4` if available).
    *   Construct a prompt for the AI that instructs it to extract the event title, date, time, and location, and to return it in a structured format (e.g., JSON).
        *   Example prompt segment: "Extract the event title, date (YYYY-MM-DD), time (HH:mm AM/PM), and location from the following text. Respond with a JSON object containing 'title', 'date', 'time', and 'location' keys. If a piece of information is not present, use null for its value. Text: [user's text]"
    *   Handle API responses, including potential errors from OpenAI.
    *   Return the parsed event data (or an error) as a JSON response.

4.  **Frontend Logic for Calling Parser API (`pages/index.tsx`):**
    *   Implement a function to be called when the user submits their event text.
    *   This function will:
        *   Make a `POST` request to your `/api/parse-event` endpoint with the input text.
        *   Handle the response:
            *   On success, update the application state with the parsed event details.
            *   On error, display an error message to the user.
    *   Manage loading state while the API call is in progress.

5.  **Integrate Parsed Data with UI:**
    *   Pass the parsed event data to the `EventPreview` component.
    *   Conditionally render the preview and enable action buttons once an event is successfully parsed.

## Phase 3: Calendar & Conflict Detection

1.  **Mock Calendar Data (`data/mockCalendar.ts`):**
    *   Create an array of `CalendarEvent` objects to simulate existing events.
    *   Include a few sample events with various dates and times.
        ```typescript
        // data/mockCalendar.ts
        import { CalendarEvent } from '../types/event';

        export const mockCalendarEvents: CalendarEvent[] = [
          { id: '1', title: 'Team Meeting', start: new Date('2024-05-20T10:00:00'), end: new Date('2024-05-20T11:00:00'), location: 'Office' },
          { id: '2', title: 'Lunch with Alex', start: new Date('2024-05-21T12:30:00'), end: new Date('2024-05-21T13:30:00') },
          // ... more events
        ];
        ```

2.  **Date/Time Handling:**
    *   Use `date-fns` (or a similar library) to parse dates and times extracted by OpenAI and to work with `Date` objects.
    *   Standardize date/time formats. OpenAI might return dates/times in various formats; ensure they are parsed correctly into `Date` objects. Assume a default duration if not specified (e.g., 1 hour).

3.  **Conflict Detection Logic (`lib/calendarUtils.ts`):**
    *   Create a function `checkConflict(newEvent: ParsedEvent, existingEvents: CalendarEvent[]): CalendarEvent[]`.
    *   This function will:
        *   Convert the `newEvent`'s date and time strings into `Date` objects. Assume a default duration (e.g., 1 hour) if an end time isn't explicitly parsed or inferable.
        *   Iterate through `existingEvents`.
        *   For each existing event, check if the `newEvent` overlaps with it.
            *   Overlap condition: `(newStart < existingEnd) && (newEnd > existingStart)`
        *   Return an array of conflicting `CalendarEvent`s.

4.  **Display Conflicts in UI (`pages/index.tsx` & `components/EventPreview.tsx`):**
    *   After parsing an event, call the `checkConflict` function.
    *   If conflicts are found, display a clear message in the `EventPreview` component or a dedicated conflict notification area.
    *   List the conflicting events.

## Phase 4: Event Actions

1.  **"Add to Calendar" Functionality:**
    *   **Simulated:** For this prototype, this can be a simple confirmation.
        *   When the user clicks "Add to Calendar":
            *   Log a message to the console (e.g., "Event added: [event details]").
            *   Optionally, add the event to an in-memory list of "added" events and display this list.
    *   **Real (Future Consideration):**
        *   Generate an ICS file: Create a `.ics` file string and make it downloadable.
        *   Google Calendar API / Apple Calendar: More complex, involving authentication and API calls.

2.  **"Share Event" Functionality:**
    *   When the user clicks "Share Event":
        *   Generate a simple text string summarizing the event (e.g., "Join me for [Title] on [Date] at [Time] at [Location]").
        *   Display this string to the user, perhaps in a modal or a read-only text area, allowing them to copy it.
        *   Alternatively, if the app were deployed, generate a shareable link to a page that displays the event details (out of scope for this basic prototype).

3.  **"Create Reminder" Functionality:**
    *   **Simulated:**
        *   When the user clicks "Create Reminder":
            *   Prompt the user (or have a fixed option) for when they want the reminder (e.g., "1 hour before," "1 day before").
            *   Log a message to the console (e.g., "Reminder set for [Event Title] at [Reminder Time]").
    *   **Real (Future Consideration):** Would involve browser notifications API or integration with a backend service.

4.  **Update UI State:**
    *   Provide feedback to the user after each action (e.g., "Event added!", "Share text copied!", "Reminder set!").
    *   Possibly clear the input or reset parts of the UI after an action is completed.

## Phase 5: Refinements & README

1.  **Error Handling & Edge Cases:**
    *   Improve error handling for OpenAI API calls (rate limits, invalid key, network issues).
    *   Handle cases where OpenAI cannot parse parts of the event (e.g., missing date, time, or location). Provide sensible defaults or ask the user for clarification (see AI-First Ideas).
    *   Consider how to handle ambiguous dates/times (e.g., "next Friday"). The initial prompt to OpenAI should try to get a specific date.

2.  **User Experience (UX) Enhancements:**
    *   Add loading indicators for API calls.
    *   Clear and concise user feedback messages.
    *   Ensure the UI is responsive and works well on different screen sizes (if targeting mobile).

3.  **AI-First Ideas (Optional Implementation):**
    *   **Clarification/Editing:**
        *   If OpenAI's parse is uncertain or missing details, allow the user to type a clarification.
        *   Send the original text + clarification back to OpenAI with a revised prompt.
        *   Alternatively, provide editable fields for title, date, time, location pre-filled by AI, allowing manual correction.
    *   **Fuzzy Phrasing:**
        *   Refine the OpenAI prompt to better handle phrases like "next Friday at noon." Instruct the AI to resolve "next Friday" to a specific date based on the current date (though this might be better handled by `date-fns` or a similar library after a relative date is extracted).

4.  **Code Quality and Organization:**
    *   Ensure components are well-defined and reusable.
    *   Use TypeScript effectively for type safety.
    *   Add comments where necessary.
    *   Organize files logically (e.g., `components/`, `pages/api/`, `lib/`, `types/`, `data/`).

5.  **Write `README.md`:**
    *   Briefly describe the project.
    *   Explain the technical approach (React, Next.js, TypeScript, OpenAI).
    *   List any assumptions made (e.g., default event duration, how mock calendar data is used).
    *   Instructions on how to set up and run the project (including API key setup).
    *   Mention any limitations or potential future improvements.

## Phase 6: Testing (Basic)

1.  **Manual Testing:**
    *   Test with various natural language inputs:
        *   Simple and complete ("Meeting on June 10th at 3 PM at Coffee Shop")
        *   Missing information ("Lunch with Sarah tomorrow")
        *   Complex or ambiguous phrasing
        *   Inputs that might cause conflicts
    *   Verify all buttons and actions work as expected.
    *   Check UI responsiveness.

This step-by-step plan provides a comprehensive roadmap. Depending on the available time, some features might be simplified or deferred. The core is to get the AI parsing and conflict detection working with a clean UI. 