import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import MetricProgressBar from './MetricProgressBar';  // <-- Import the progress bar component

const CoreWebVitalsModal = ({ cwv_scores, onClose }) => {
  const hasMobileData = cwv_scores?.mobile;
  const hasDesktopData = cwv_scores?.desktop;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-[#007BFF]">Core Web Vitals - Lab Data</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {/* Mobile Core Web Vitals */}
          {hasMobileData ? (
            <>
              <h4 className="text-lg font-semibold mb-4">Mobile</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* LCP */}
                <MetricProgressBar
                  label="LCP"
                  value={cwv_scores.mobile.LCP}
                  maxValue={5}
                  thresholds={[2.5, 4.0]}
                  unit="s"
                />
                {/* TBT */}
                <MetricProgressBar
                  label="TBT"
                  value={cwv_scores.mobile.TBT}
                  maxValue={1}
                  thresholds={[0.2, 0.6]}
                  unit="s"
                />
                {/* CLS */}
                <MetricProgressBar
                  label="CLS"
                  value={cwv_scores.mobile.CLS}
                  maxValue={1}
                  thresholds={[0.1, 0.25]}
                  unit=""
                />
                {/* Overall Score */}
                <MetricProgressBar
                  label="Overall Score"
                  value={cwv_scores.mobile.overall_score}
                  maxValue={100}
                  thresholds={[50, 90]}
                  unit=""
                />
              </div>
            </>
          ) : (
            <p>No mobile data available.</p>
          )}

          {/* Desktop Core Web Vitals */}
          {hasDesktopData ? (
            <>
              <h4 className="text-lg font-semibold mb-4 mt-6">Desktop</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <MetricProgressBar
                  label="LCP"
                  value={cwv_scores.desktop.LCP}
                  maxValue={5}
                  thresholds={[2.5, 4.0]}
                  unit="s"
                />
                <MetricProgressBar
                  label="TBT"
                  value={cwv_scores.desktop.TBT}
                  maxValue={1}
                  thresholds={[0.2, 0.6]}
                  unit="s"
                />
                <MetricProgressBar
                  label="CLS"
                  value={cwv_scores.desktop.CLS}
                  maxValue={1}
                  thresholds={[0.1, 0.25]}
                  unit=""
                />
                <MetricProgressBar
                  label="Overall Score"
                  value={cwv_scores.desktop.overall_score}
                  maxValue={100}
                  thresholds={[50, 90]}
                  unit=""
                />
              </div>
            </>
          ) : (
            <p>No desktop data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoreWebVitalsModal;
