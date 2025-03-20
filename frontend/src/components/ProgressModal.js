import React, { useEffect, useState } from 'react';

const ProgressModal = ({ onClose, showTips }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  // List of messages based on whether CWV is selected or not
  const messages = showTips
    ? [
        "Running Core Web Vitals tests...",
        "Evaluating your site's performance...",
        "Optimization suggestions:",
        "1. Use lazy loading for images.",
        "2. Minimize CSS and JavaScript files.",
        "3. Enable caching with a plugin like WP Rocket.",
        "4. Upgrade hosting for improved speed.",
        "5. Optimize your database with plugins like WP-Optimize.",
        "6. Compress and optimize images using tools like Smush or ShortPixel.",
        "7. Consider using a Content Delivery Network (CDN) like Cloudflare.",
      ]
    : [
        "Grabbing data...",
        "Analyzing key metrics...",
        "Almost there...",
      ];

  // Cycle through messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) =>
        prevIndex < messages.length - 1 ? prevIndex + 1 : prevIndex
      );
    }, 2000);  // Update every 2 seconds

    return () => clearInterval(interval);  // Clean up on unmount
  }, [messages.length]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        {/* Modal Header */}
        <h2 className="text-2xl font-semibold text-[#007BFF] mb-4">Processing...</h2>

        {/* Modern Loader */}
        <div className="flex justify-center mb-4">
          <div className="loader"></div>
        </div>

        {/* Progress Message */}
        <p className="text-center text-sm">{messages[messageIndex]}</p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
        >
          &#10005;
        </button>
      </div>
    </div>
  );
};

export default ProgressModal;
