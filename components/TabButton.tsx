
import React from 'react';

interface TabButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, icon, isActive, onClick }) => {
  const baseClasses = 'flex-shrink-0 w-full flex items-center justify-start space-x-3 p-3 rounded-lg font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500';
  const activeClasses = 'bg-blue-600 text-white shadow-md';
  const inactiveClasses = 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white';

  return (
    <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
};

export default TabButton;
