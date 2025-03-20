import React from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faExclamation} from '@fortawesome/free-solid-svg-icons';
import ReactDOM from 'react-dom'; // For portal to render modal outside the current component

const Modal = ({ title, content, onClose, onCopy, onCopyDelayedJs, copied, copiedDelayed }) => {
  const handleCopy = () => {
    onCopy();
    toast.success('Copied to clipboard!');  // Display toast notification
  };

  const handleCopyDelayedJs = () => {
    onCopyDelayedJs();
    toast.success('Copied delayed JS to clipboard!');  // Display toast notification
  };

  // Function to format content for recommendations with sticker-style icons
  const formatContent = (item) => {
    if (typeof item === 'string') {
      // Check for specific status keywords and add appropriate icons
      if (item.includes('No changes needed')) {
        const parts = item.split('No changes needed');
        return (
          <>
            {parts[0]}
            <span className="inline-flex items-center ml-2 text-green-800 bg-green-100 px-2 py-1 rounded-full text-xs font-semibold">
              <FontAwesomeIcon icon={faCheckCircle} className="mr-5" />
              No changes needed
            </span>
          </>
        );
      }

      if (item.includes('Exclude from delay')) {
        const parts = item.split('Exclude from delay');
        return (
          <>
            {parts[0]}
            <span className="inline-flex items-center ml-2 text-red-800 bg-red-100 px-2 py-1 rounded-full text-xs font-semibold">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
              Exclude from delay
            </span>
          </>
        );
      }
      if (item.includes('Be aware of this')) {
        const parts = item.split('Be aware of this');
        return (
          <>
            {parts[0]}
            <span className="inline-flex items-center ml-2 text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full text-xs font-semibold">
              <FontAwesomeIcon icon={faExclamation} className="mr-1" />
              Be aware of this: Not found in page source
            </span>
          </>
        );
      }

      // Colorize the "--- pmdelayed" part
      if (item.includes('--- pmdelayed')) {
        const parts = item.split('--- pmdelayed');
        return (
          <>
            {parts[0]}
            <span className="ml-2 text-red-500">--- pmdelayed</span>
          </>
        );
      }

      return item;
    }

    return item;
  };

  // Function to handle grouping for "Sanity Check Recommendations"
  const formatSanityCheckRecommendations = (items) => {
    const groupedContent = {};

    items.forEach((item) => {
      const [pluginTheme, jsIdAndStatus] = item.split(': ');
      const [jsId, status] = jsIdAndStatus.split(' - ');

      if (!groupedContent[pluginTheme]) {
        groupedContent[pluginTheme] = [];
      }
      groupedContent[pluginTheme].push({ jsId, status });
    });

    return groupedContent;
  };

  const renderStatusBadge = (status) => {
    if (status === 'No changes needed') {
      return (
        <span className="inline-flex items-center ml-2 text-green-800 bg-green-200 px-2 py-1 rounded-full text-xs font-semibold">
          <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
          No changes needed
        </span>
      );
    } else if (status === 'Exclude from delay') {
      return (
        <span className="inline-flex items-center ml-2 text-red-800 bg-red-200 px-2 py-1 rounded-full text-xs font-semibold">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
          Exclude from delay
        </span>
      );
    } else if (status === 'Be aware of this') {
      return (
        <span className="inline-flex items-center ml-2 text-indigo-800 bg-indigo-200 px-2 py-1 rounded-full text-xs font-semibold">
          <FontAwesomeIcon icon={faExclamation} className="mr-1" />
          Be aware of this: Not found in page source
        </span>
      );
    }
    return null;
  };

  // Only show "Copy Delayed JS" button for JS IDs section
  const isJsIdsSection = title === 'JS IDs';
  const hasDelayedJs = isJsIdsSection && (
    Array.isArray(content) 
      ? content.some(item => typeof item === 'string' && item.includes('--- pmdelayed'))
      : typeof content === 'string' && content.includes('--- pmdelayed')
  );

  // Render modal into a portal to avoid affecting layout
  return ReactDOM.createPortal(
    <>
      <ToastContainer />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative">
          {/* Modal Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-[#007BFF]">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              &#10005; {/* Close button */}
            </button>
          </div>

          {/* Modal Content */}
          <div className="mt-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-[#007BFF] scrollbar-track-gray-200 pr-2">
            <ul className="list-disc ml-6 text-sm">
              {/* Special formatting for "Sanity Check Recommendations" */}
              {title === 'Sanity Check Recommendations' && Array.isArray(content) ? (
                Object.entries(formatSanityCheckRecommendations(content)).map(([pluginTheme, jsIds], index) => (
                  <div key={index} className="mb-4">
                    {/* Plugin/Theme Heading */}
                    <h3 className="font-semibold text-lg text-[#007BFF] mb-2">{pluginTheme}</h3>
                    {/* JS IDs with status */}
                    <ul className="list-disc ml-6 text-sm">
                      {jsIds.map((jsItem, idx) => (
                        <li key={idx} className="flex items-center">
                          <span>{jsItem.jsId}</span>
                          {renderStatusBadge(jsItem.status)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                // Handle default content formatting
                Array.isArray(content) ? (
                  content.map((item, index) => (
                    <li key={index}>{formatContent(item)}</li>
                  ))
                ) : (
                  <li>{formatContent(content)}</li>
                )
              )}
            </ul>
          </div>

          {/* Footer with Copy Buttons */}
          <div className="mt-6 flex justify-end space-x-4">
            {hasDelayedJs && onCopyDelayedJs && (
              <button
                onClick={handleCopyDelayedJs}
                className="bg-[#FF6B6B] text-white py-2 px-4 rounded-lg hover:bg-[#E05050] transition duration-300"
              >
                {copiedDelayed ? 'Delayed JS Copied!' : 'Copy Delayed JS'}
              </button>
            )}
            {onCopy && (
              <button
                onClick={handleCopy}
                className="bg-[#32CC86] text-white py-2 px-4 rounded-lg hover:bg-[#28a97f] transition duration-300"
              >
                {copied ? 'Copied!' : 'Copy All'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body // Render modal into the body to avoid layout issues
  );
};

export default Modal;
