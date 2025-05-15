import { CalendarEvent } from '../types/event';

// Get current year and month for more relevant mock data
const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH = TODAY.getMonth(); // 0-indexed (0 for January)

// Helper function to create dates in the current month and year
const createDate = (day: number, hour: number, minute: number = 0) => {
  return new Date(CURRENT_YEAR, CURRENT_MONTH, day, hour, minute);
};

// For "Project Deadline Review" (id: '3')
let projectDeadlineYear = CURRENT_YEAR;
let projectDeadlineMonth = CURRENT_MONTH + 1; // JS months are 0-11
if (projectDeadlineMonth > 11) { // Handle year rollover
  projectDeadlineMonth = 0; // January
  projectDeadlineYear += 1;
}

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
    title: 'Project Deadline Review',
    // Correctly create date for 2nd of next month at 2:00 PM (14:00)
    start: new Date(projectDeadlineYear, projectDeadlineMonth, 2, 14, 0),
    // End 1 hour later, at 3:00 PM (15:00)
    end: new Date(projectDeadlineYear, projectDeadlineMonth, 2, 15, 0),
  },
  {
    id: '4',
    title: 'Dentist Appointment',
    start: createDate(15, 10, 30), // Potential conflict with Team Meeting
    end: createDate(15, 11, 0),
    location: 'Oak Street Dental',
  },
  {
    id: '5',
    title: 'Evening Yoga Class',
    start: createDate(20, 18, 0),
    end: createDate(20, 19, 0),
    location: 'Community Center',
  }
];

// To check the generated dates (for debugging, can be removed)
// console.log("Mock Calendar Events:", mockCalendarEvents.map(e => ({title: e.title, start: e.start.toLocaleString(), end: e.end.toLocaleString()}))); 