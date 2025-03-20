import React, { useState } from 'react';
import Modal from './Modal';

const Toggle = ({ title, content, showCopy = true, isCodeSnippet = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedDelayed, setCopiedDelayed] = useState(false);

  // Copy the content to the clipboard
  const handleCopy = () => {
    let textToCopy = '';

    if (Array.isArray(content)) {
      // For JS IDs or similar arrays, remove '--- pmdelayed' part
      textToCopy = content
        .map((item) => (typeof item === 'string' ? item.split(' --- pmdelayed')[0] : item))
        .join('\n');
    } else if (typeof content === 'string') {
      // If content is a simple string
      textToCopy = content;
    } else if (isCodeSnippet) {
      // Extract text content from JSX code snippets
      textToCopy = content.join('\n');  // For inline scripts
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);

    // Revert "Copied!" back to "Copy" after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Copy only the delayed JS content to the clipboard
  const handleCopyDelayedJs = () => {
    // Only proceed if this is the JS IDs section
    if (title !== 'JS IDs') {
      return;
    }

    let delayedJsContent = [];

    if (Array.isArray(content)) {
      // Filter items that contain "--- pmdelayed"
      delayedJsContent = content.filter(item => 
        typeof item === 'string' && item.includes('--- pmdelayed')
      );
      
      // Extract only the JS IDs without the status part
      if (delayedJsContent.length > 0) {
        delayedJsContent = delayedJsContent.map(item => {
          // Get the part before "--- pmdelayed"
          const jsId = item.split(' --- pmdelayed')[0];
          return jsId;
        });
      }
    } else if (typeof content === 'string' && content.includes('--- pmdelayed')) {
      delayedJsContent.push(content.split(' --- pmdelayed')[0]);
    }

    if (delayedJsContent.length > 0) {
      navigator.clipboard.writeText(delayedJsContent.join('\n'));
      setCopiedDelayed(true);

      // Revert "Copied!" back to "Copy Delayed JS" after 2 seconds
      setTimeout(() => {
        setCopiedDelayed(false);
      }, 2000);
    }
  };

  return (
    <>
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 transition-all duration-300 h-16 flex items-center justify-center">
        <button
          className="w-full text-left text-white bg-[#007BFF] rounded-lg focus:outline-none hover:bg-[#0056b3] transition duration-300 h-full px-4 py-2"
          onClick={() => setIsModalOpen(true)}
        >
          {title} <span className="float-right">+</span>
        </button>
      </div>

      {/* Render modal */}
      {isModalOpen && (
        <Modal
          title={title}
          content={content}
          onClose={() => setIsModalOpen(false)}
          onCopy={showCopy ? handleCopy : null} // Show the copy button only if showCopy is true
          onCopyDelayedJs={(showCopy && title === 'JS IDs') ? handleCopyDelayedJs : null} // Only show for JS IDs section
          copied={copied}
          copiedDelayed={copiedDelayed}
        />
      )}
    </>
  );
};

export default Toggle;
