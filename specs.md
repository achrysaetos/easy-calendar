🧠 The Scenario
We’re trying to build a smart operating system for families. One small but high-friction task we want to simplify is: turning info buried in emails or texts into calendar invites.  We want to make that a one-tap experience — with AI doing the heavy lifting.

🎯 The Prompt
Please build a simple web or mobile prototype that allows a user to:
1. Paste or input a natural language event (e.g., “Parent-teacher conference on May 5 at 4pm at Washington Elementary”)
2. Use OpenAI API to parse the event: extract the title, date, time, and location
3. Check for conflicts against existing events (mocked calendar data is fine)
4. Show a clean preview of the parsed event
5. Allow the user to:
Tap to add it to their calendar (Google/Apple/ICS — simulated is fine)
Tap to share the event (generate a shareable text or link)
Tap to create a reminder (e.g. “Remind me the night before”)

✅ Requirements
One clean input field for the event text
AI-based parsing of unstructured input
Conflict detection using a mocked calendar
Basic UI to confirm and act on the event
A brief README explaining your approach and assumptions

🤖 AI-First Ideas (optional, pick one or more)
Use OpenAI to extract event details
Let the user “clarify” or “edit” via AI
Handle fuzzy phrasing like “lunch w/ Jen next Friday at noon”
