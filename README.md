# AI-Powered Calendar Assistant

A Next.js calendar web app that transforms natural language event descriptions into structured calendar entries using AI to parse event details and check for scheduling conflicts. 

Visit the deployed version at [https://easy-calendar-ten.vercel.app/](https://easy-calendar-ten.vercel.app/)

## Core Idea & Technical Approach

*   **Frontend:** Built with [React](https://reactjs.org/) and [Next.js](https://nextjs.org/) for a dynamic and performant user interface.
*   **Language:** [TypeScript](https://www.typescriptlang.org/) ensures code reliability and maintainability through static typing.
*   **AI-Powered Parsing:** The [OpenAI API](https://openai.com/api/) is used to parse unstructured text in order to extract:
    *   Event Title
    *   Date
    *   Time
    *   Location
*   **Date/Time Handling:** The [`date-fns`](https://date-fns.org/) library provides robust tools for manipulating dates and times, crucial for conflict checking and event representation.
*   **Styling & Icons:** Functional and clean styling is prioritized for usability and customization (using Tailwind CSS).

**Workflow:**

1.  **Input:** User provides event text (e.g., "Meeting with marketing team next Tuesday at 2pm in Conference Room B"). Fuzzy phrasing like “lunch w/ Jen next Friday at noon” is also supported.
2.  **AI Parsing:** The text is sent to a Next.js API route, which queries the OpenAI API.
3.  **Structured Data:** OpenAI returns structured event data (title, date, time, location).
4.  **Conflict Check:** The system compares the new event against a mock list of existing calendar events.
5.  **Preview & Act:** The user sees a preview of the parsed event and any conflicts, then can choose to:
    *   Add to calendar
    *   Share event details (copies to clipboard)
    *   Set a reminder (adds to list)
6. **Clear events:** The events are stored in the browser's local storage. You can refresh the page to clear the local storage and reset the events.

## Key Assumptions

*   **Default Event Duration:** A 1-hour duration is assumed if not specified, for conflict checking.
*   **Mock Calendar Data:** Conflict detection uses a predefined list of mocked events for demonstration purposes.
*   **Simulated Actions:** Calendar integration ("Share Event", "Create Reminder") is simulated (e.g., through console logs) for this prototype.

## Getting Started

1. Create a `.env.local` file in the project root and add your personal `OPENAI_API_KEY`.

2. Run the app with `npm run dev` and access at `http://localhost:3000`.

OR you can use the deployed version at [https://easy-calendar-ten.vercel.app/](https://easy-calendar-ten.vercel.app/).

## Current Limitations & Future Work

**LLM Performance and Optimizations:**

*   **Vercel AI SDK:** Use this framework to make LLM calls more consistent, reliable, and clean. Code organization will be improved and LLM calls will be more performant.
*   **Structured Output:** Implement Zod for schema validation of the structured output. This will increase the accuracy of the parsed data and provide better error handling for unexpected inputs.
*   **Evals platform:** Integrate with an evals platform like Braintrust or Humanloop to get feedback on the model's performance and improve it over time.

**Production Features:**

*   **Real Calendar Integration:** Use a MCP server or integrate the Google/Apple Calendar APIs. This will be great for testing real-world scenarios and provide a more realistic experience for managing events.
*   **Persistent Storage:** Calendar events and reminders are currently stored locally, but in a production environment, this would be stored in a database and synced across devices. Supabase could be a good choice because it has built in authentication and row level security.
*   **More Personalized AI:** Store user's behavior and preferences in the database to provide a customized experience. This can be fed to the AI as a system prompt.
*   **Active Reminders:** Implement browser notifications or backend reminder services such as email or SMS. Mobile apps can handle in-app notifications better though I think.
*   **UI/UX Polish:** Design features like editable event fields for manual corrections.
