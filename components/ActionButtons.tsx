import React from 'react';
import { CalendarPlus, Share2, BellRing } from 'lucide-react'; // Example icons

interface ActionButtonsProps {
  onAddToCalendar: () => void;
  onShare: () => void;
  onRemind: () => void;
  disabled: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onAddToCalendar,
  onShare,
  onRemind,
  disabled,
}) => {
  const buttonBaseClasses = "flex items-center justify-center space-x-2 w-full sm:w-auto text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out";
  const enabledClasses = "bg-green-500 hover:bg-green-600";
  const disabledClasses = "bg-gray-400 cursor-not-allowed";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <button
        onClick={onAddToCalendar}
        disabled={disabled}
        className={`${buttonBaseClasses} ${disabled ? disabledClasses : enabledClasses}`}
      >
        <CalendarPlus size={18} />
        <span>Add to Calendar</span>
      </button>
      <button
        onClick={onShare}
        disabled={disabled}
        className={`${buttonBaseClasses} ${disabled ? disabledClasses : 'bg-yellow-500 hover:bg-yellow-600'}`}
      >
        <Share2 size={18} />
        <span>Share Event</span>
      </button>
      <button
        onClick={onRemind}
        disabled={disabled}
        className={`${buttonBaseClasses} ${disabled ? disabledClasses : 'bg-purple-500 hover:bg-purple-600'}`}
      >
        <BellRing size={18} />
        <span>Create Reminder</span>
      </button>
    </div>
  );
};

export default ActionButtons; 