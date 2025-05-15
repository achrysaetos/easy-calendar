import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ParsedEvent } from '../../../types/event'; // Adjust path as necessary

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventText: string = body.eventText;

    if (!eventText || typeof eventText !== 'string' || eventText.trim() === '') {
      return NextResponse.json({ error: 'eventText is required and must be a non-empty string' }, { status: 400 });
    }

    // Construct the prompt for OpenAI
    const prompt = `Extract the event title, start date and time, end date and time, and location from the following text.
    Today's date is ${new Date().toISOString().split('T')[0]}, which is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}.

    Format the start and end date/times as "YYYY-MM-DD HH:mm" (24-hour format).
    If an end time is not specified, calculate it as 1 hour after the start time.
    If a date is specified in relative terms (e.g., "next Friday", "tomorrow"), convert it to an absolute date (YYYY-MM-DD).
    If a time is specified in relative terms (e.g., "noon", "evening"), convert it to a specific time (HH:mm).

    Respond with a JSON object ONLY, with the keys "title", "startDateTimeString", "endDateTimeString", and "location".
    If a piece of information is not found (e.g. location), use an empty string "" for its value. If title is missing, try to infer a sensible one or use "Untitled Event".

    Examples:
    1. Text: "Lunch with Jen next Friday at noon at The Cafe for 2 hours"
       Expected JSON: { "title": "Lunch with Jen", "startDateTimeString": "YYYY-MM-DD 12:00", "endDateTimeString": "YYYY-MM-DD 14:00", "location": "The Cafe" } (Note: YYYY-MM-DD should be the resolved date of next Friday)
    2. Text: "Team meeting tomorrow 10am at the office"
       Expected JSON: { "title": "Team meeting", "startDateTimeString": "YYYY-MM-DD 10:00", "endDateTimeString": "YYYY-MM-DD 11:00", "location": "the office" } (Note: YYYY-MM-DD should be the resolved date of tomorrow)
    3. Text: "Doctor's appointment on June 5th, 3 PM"
       Expected JSON: { "title": "Doctor's appointment", "startDateTimeString": "YYYY-06-05 15:00", "endDateTimeString": "YYYY-06-05 16:00", "location": "" } (Note: YYYY should be the current or upcoming year as appropriate)

    Text to parse: "${eventText}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Or your preferred model, e.g., gpt-4
      messages: [
        { role: "system", content: "You are an assistant that extracts event details and responds in JSON format." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" }, // Enforce JSON output if using a compatible model
      temperature: 0.2, // Lower temperature for more deterministic output
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'Failed to parse event from OpenAI response' }, { status: 500 });
    }

    // Attempt to parse the JSON content
    let parsedDetails;
    try {
      parsedDetails = JSON.parse(content);
    } catch (e) {
      console.error("Error parsing JSON from OpenAI:", e, "Raw content:", content);
      return NextResponse.json({ error: 'OpenAI returned invalid JSON format', details: content }, { status: 500 });
    }

    // Validate the structure of parsedDetails (optional but good practice)
    if (!parsedDetails.title && !parsedDetails.startDateTimeString && !parsedDetails.location) {
        // If key fields are missing, it might indicate an issue or very vague input
        console.warn("OpenAI returned potentially incomplete fields for text:", eventText, "Response:", parsedDetails);
        // Decide if this should be an error or handled differently.
        // For now, we'll proceed and let the frontend/date parsing utilities handle potentially empty strings.
    }

    const parsedEvent: Omit<ParsedEvent, 'originalText'> = {
      title: parsedDetails.title && parsedDetails.title.trim() ? parsedDetails.title : 'Untitled Event',
      startDateTimeString: parsedDetails.startDateTimeString && parsedDetails.startDateTimeString.trim() ? parsedDetails.startDateTimeString : '',
      endDateTimeString: parsedDetails.endDateTimeString && parsedDetails.endDateTimeString.trim() ? parsedDetails.endDateTimeString : '', // Keep empty if not present
      location: parsedDetails.location && parsedDetails.location.trim() ? parsedDetails.location : '',
    };

    return NextResponse.json(parsedEvent);

  } catch (error) {
    console.error('Error in /api/parse-event:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof OpenAI.APIError) {
        errorMessage = `OpenAI API Error: ${error.status} ${error.name} ${error.message}`;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage, details: error instanceof Error ? error.stack : undefined }, { status: 500 });
  }
} 