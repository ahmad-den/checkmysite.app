import React from 'react';

// Progress bar to show Core Web Vitals similar to PSI report
const MetricProgressBar = ({ label, value, maxValue, thresholds, unit }) => {
  const percentage = (value / maxValue) * 100;

  // Calculate where the pointer should be based on the value
  const getPointerPosition = () => {
    if (value <= thresholds[0]) return `${(value / thresholds[0]) * 33.33}%`;
    if (value <= thresholds[1]) return `${33.33 + ((value - thresholds[0]) / (thresholds[1] - thresholds[0])) * 33.33}%`;
    return `${66.66 + ((value - thresholds[1]) / (maxValue - thresholds[1])) * 33.33}%`;
  };

  return (
    <div className="my-4">
      <div className="flex justify-between">
        <span className="font-semibold">{label}</span>
        <span className="font-semibold">{value.toFixed(2)} {unit}</span>
      </div>
      <div className="relative h-4 mt-2 rounded-full bg-gray-300">
        <div
          className="absolute h-4 rounded-l-full bg-green-500"
          style={{ width: `${(thresholds[0] / maxValue) * 100}%` }}
        ></div>
        <div
          className="absolute h-4 bg-orange-500"
          style={{
            left: `${(thresholds[0] / maxValue) * 100}%`,
            width: `${((thresholds[1] - thresholds[0]) / maxValue) * 100}%`,
          }}
        ></div>
        <div
          className="absolute h-4 rounded-r-full bg-red-500"
          style={{
            left: `${(thresholds[1] / maxValue) * 100}%`,
            width: `${((maxValue - thresholds[1]) / maxValue) * 100}%`,
          }}
        ></div>
        <div
          className="absolute top-0 left-0 h-6 w-6 bg-blue-600 rounded-full"
          style={{ transform: `translateX(${getPointerPosition()})` }}
        ></div>
      </div>
    </div>
  );
};

export default MetricProgressBar;

