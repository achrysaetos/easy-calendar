import { CalendarEvent } from '../types/event';

// Get current year and month for more relevant mock data
const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH = TODAY.getMonth(); // 0-indexed (0 for January)

// Helper function to create dates in the current month and year
const createDate = (day: number, hour: number, minute: number = 0) => {
  return new Date(CURRENT_YEAR, CURRENT_MONTH, day, hour, minute);
};

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Meeting',
    start: createDate(15, 10, 0), // Example: 15th of current month at 10:00 AM
    end: createDate(15, 11, 30),   // Example: 15th of current month at 11:30 AM
    location: 'Office Conference Room A',
  },
  {
    id: '2',
    title: 'Lunch with Alex',
    start: createDate(17, 12, 30), // Example: 17th of current month at 12:30 PM
    end: createDate(17, 13, 30),
    location: 'Downtown Diner',
  },
  {
    id: '3',
    title: 'Evening Yoga Class',
    start: createDate(20, 18, 0),
    end: createDate(20, 19, 0),
    location: 'Community Center',
  }
];

// To check the generated dates (for debugging, can be removed)
// console.log("Mock Calendar Events:", mockCalendarEvents.map(e => ({title: e.title, start: e.start.toLocaleString(), end: e.end.toLocaleString()}))); 