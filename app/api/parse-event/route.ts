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
    const prompt = `Extract the event title, date (in YYYY-MM-DD format if possible, otherwise as is), time (in HH:mm AM/PM format if possible, otherwise as is), and location from the following text. 
    Respond with a JSON object ONLY, with the keys "title", "date", "time", and "location".
    If a piece of information is not found, use an empty string for its value.
    For example, if the text is "Lunch with Jen next Friday at noon at The Cafe", the response should be like:
    {
      "title": "Lunch with Jen",
      "date": "next Friday", 
      "time": "12:00 PM",
      "location": "The Cafe"
    }
    If the text is "Team meeting tomorrow 10am", the response should be like:
    {
      "title": "Team meeting",
      "date": "tomorrow",
      "time": "10:00 AM",
      "location": ""
    }
    Text: "${eventText}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125", // Or your preferred model, e.g., gpt-4
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
    if (!parsedDetails.title && !parsedDetails.date && !parsedDetails.time && !parsedDetails.location) {
        // If all fields are empty, it might indicate an issue or very vague input
        console.warn("OpenAI returned all empty fields for text:", eventText, "Response:", parsedDetails);
        // Decide if this should be an error or handled differently
    }

    const parsedEvent: Omit<ParsedEvent, 'originalText'> = {
      title: parsedDetails.title || '',
      date: parsedDetails.date || '',
      time: parsedDetails.time || '',
      location: parsedDetails.location || '',
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