import React from 'react';

interface EventInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const EventInput: React.FC<EventInputProps> = ({ value, onChange, onSubmit }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <textarea
        value={value}
        onChange={handleInputChange}
        placeholder="Paste or type your event details here (e.g., Parent-teacher conference on May 5 at 4pm at Washington Elementary)"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={4}
      />
      <button
        type="submit"
        className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out"
      >
        Parse Event
      </button>
    </form>
  );
};

export default EventInput; 