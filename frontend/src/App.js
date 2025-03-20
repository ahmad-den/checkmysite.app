import React, { useState } from 'react';
import Header from './components/Header';
import AnalyzerForm from './components/AnalyzerForm';
import Results from './components/Results';
import ProgressModal from './components/ProgressModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const [results, setResults] = useState(null);  // Store results
  const [loading, setLoading] = useState(false);  // Loading state
  const [showTips, setShowTips] = useState(false); // Show tips state
  const [lighthouseReportUrl, setLighthouseReportUrl] = useState(null);  // Store Lighthouse report URL
  const [toastId, setToastId] = useState(null);  // Track the toast ID to avoid duplicates

  // This function triggers the analysis and fetches the backend API
  const handleAnalyze = async (data) => {
    setLoading(true);  // Start loading
    setShowTips(data.runCoreWebVitals);  // Show tips if Core Web Vitals is selected

    // Reset the Lighthouse report URL if CWV test is not being run
    if (!data.runCoreWebVitals) {
      setLighthouseReportUrl(null);  // Reset Lighthouse report URL
    }

    try {
      const response = await fetch('https://checkmysite.app/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: data.url,
          option: data.option,
          run_psi: data.runCoreWebVitals  // Sending whether to run Core Web Vitals or not
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const resultData = await response.json(); // Get the data from backend
      setResults(resultData);  // Update results state with data from backend

      // If CWV was selected, start polling for the report generation
      if (data.runCoreWebVitals && resultData.reportUrl) {
        handleLighthouseReport(resultData.reportUrl);
      }
    } catch (error) {
      console.error('Error analyzing the site:', error);
      toast.error('Error analyzing the site.');
    } finally {
      setLoading(false);  // Stop loading once data is received
    }
  };

  // Function to handle Lighthouse report generation and polling
  const handleLighthouseReport = async (reportUrl) => {
    if (toastId) {
      // If a toast is already active, do not show another one
      return;
    }

    // Show toast for generating report and store the toastId
    const newToastId = toast.info('Generating Core Web Vitals report...', {
      autoClose: false,  // Keep toast open until manually closed
      closeOnClick: false,  // Disable close on click
    });
    setToastId(newToastId);

    // Poll the backend until the report is available
    let reportGenerated = false;
    while (!reportGenerated) {
      try {
        const response = await fetch(reportUrl, { method: 'HEAD' });
        if (response.ok) {
          reportGenerated = true;
          setLighthouseReportUrl(reportUrl);  // Set the report URL once generated
          toast.dismiss(newToastId);  // Dismiss the "Generating" toast
          toast.success('Core Web Vitals report generated successfully!', { autoClose: 5000 });
        }
      } catch (err) {
        console.error('Error polling for report completion:', err);
      }

      if (!reportGenerated) {
        await new Promise((resolve) => setTimeout(resolve, 5000));  // Poll every 5 seconds
      }
    }

    // Reset toastId after completion
    setToastId(null);
  };

  return (
    <div className="bg-[#F4F4F9] min-h-screen">
      <Header />
      <main className="container mx-auto mt-8 p-4">
        <AnalyzerForm onAnalyze={handleAnalyze} onLighthouseReport={handleLighthouseReport} />
        
        {/* Show Progress Modal while loading */}
        {loading && (
          <ProgressModal
            onClose={() => setLoading(false)}
            showTips={showTips}
          />
        )}

        {/* Show results only after analysis is complete */}
        {results && !loading && (
          <Results results={results} lighthouseReportUrl={lighthouseReportUrl} showCoreWebVitals={showTips} />
        )}
      </main>
      <ToastContainer />  {/* Toast notifications container */}
    </div>
  );
};

export default App;
