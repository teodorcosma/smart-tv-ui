import React from 'react';

interface SpeedSelectorProps {
  currentSpeed: number;
  onChange: (speed: number) => void;
}

const SpeedSelector: React.FC<SpeedSelectorProps> = ({ currentSpeed, onChange }) => {
  const speeds = [
    { value: 0, label: 'Auto' },
    { value: 1, label: '1 Mbps (Low)' },
    { value: 3, label: '3 Mbps (Medium)' },
    { value: 5, label: '5 Mbps (High)' },
    { value: 10, label: '10 Mbps (Very High)' }
  ];

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-white mb-2">Simulated Network Speed</h3>
      <div className="flex flex-wrap gap-2">
        {speeds.map((speed) => (
          <button
            key={speed.value}
            onClick={() => onChange(speed.value)}
            className={`px-3 py-1 rounded ${
              currentSpeed === speed.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
            }`}
          >
            {speed.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SpeedSelector;
