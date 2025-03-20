import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faRocket } from '@fortawesome/free-solid-svg-icons';
import Toggle from './Toggle';
import CoreWebVitalsModal from './CoreWebVitalsModal';
import 'react-circular-progressbar/dist/styles.css';

const getStatusType = (cache_status, bigscoots_cache_status, cache_plan, performance_tools) => {
  const isHit =
    cache_status.includes('HIT') &&
    bigscoots_cache_status.includes('HIT') &&
    cache_plan === 'Performance Plus' &&
    !performance_tools.includes('No Perfmatters');
  const isBypass =
    cache_status.includes('BYPASS') ||
    bigscoots_cache_status.includes('BYPASS') ||
    performance_tools.includes('No Perfmatters');
  return isHit
    ? { icon: faCheckCircle, colorClass: 'hit' }
    : isBypass
    ? { icon: faExclamationTriangle, colorClass: 'miss' }
    : { icon: faExclamationTriangle, colorClass: 'miss' };
};

const Results = ({ results, lighthouseReportUrl, showCoreWebVitals }) => {
  const [isCwvModalOpen, setIsCwvModalOpen] = useState(false);
  const { js_ids, css_ids, inline_scripts, cache_status, bigscoots_cache_status, cache_plan, performance_tools, plugins, themes, recommendations, cwv_scores } = results;

  const statusType = getStatusType(cache_status, bigscoots_cache_status, cache_plan, performance_tools);

  // Function to render each script as a code snippet with word-wrap
 const renderInlineScripts = (scripts) => {
   if (!scripts || scripts.length === 0) {
     return <p>No inline scripts found</p>;
   }
 
   return scripts.map((script, index) => (
     <div key={index} className="bg-gray-100 p-2 rounded-lg my-2">
       <pre className="bg-gray-200 p-4 rounded shadow-inner w-full overflow-hidden">
         <code className="text-xs text-gray-800 whitespace-pre-wrap break-all">{script}</code>
       </pre>
     </div>
   ));
 };
  return (
    <div className="mt-8">
      <h3 className="text-3xl font-semibold text-[#007BFF] mb-6 text-center">Results</h3>

      {/* Cache Status Stickers */}
      <div className="cache-status-stickers flex justify-center items-center space-x-4 text-center flex-wrap">
        <div className={`sticker ${cache_status.includes('HIT') ? 'hit' : 'miss'} mx-2`}>
          <FontAwesomeIcon icon={cache_status.includes('HIT') ? faCheckCircle : faExclamationTriangle} className="mr-2" />
          {cache_status}
        </div>

        <div className={`sticker ${bigscoots_cache_status.includes('HIT') ? 'hit' : 'miss'} mx-2`}>
          <FontAwesomeIcon icon={bigscoots_cache_status.includes('HIT') ? faCheckCircle : faExclamationTriangle} className="mr-2" />
          {bigscoots_cache_status}
        </div>

        <div className={`sticker ${cache_plan === 'Performance Plus' ? 'hit' : 'miss'} mx-2`}>
          <FontAwesomeIcon icon={faRocket} className="mr-2" />
          {cache_plan}
        </div>

        <div className={`sticker ${performance_tools.includes('No Perfmatters') ? 'miss' : 'hit'} mx-2`}>
          <FontAwesomeIcon icon={performance_tools.includes('No Perfmatters') ? faExclamationTriangle : faCheckCircle} className="mr-2" />
          {performance_tools}
        </div>
      </div>

      {/* Toggles for JS IDs, CSS IDs, Inline Scripts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <Toggle title="JS IDs" content={js_ids} />
        <Toggle title="CSS IDs - Delayed" content={css_ids} />
        <Toggle title="Inline Scripts" content={renderInlineScripts(inline_scripts)} /> {/* Render inline scripts */}
        <Toggle title="Sanity Check Recommendations" content={recommendations} />
        <Toggle title="Plugins" content={plugins} />
        <Toggle title="Theme" content={themes} />
      </div>

      {/* Core Web Vitals report */}
      {showCoreWebVitals && !lighthouseReportUrl && (
        <div className="text-center text-sm text-gray-500 mt-4">Generating Core Web Vitals report...</div>
      )}

      {lighthouseReportUrl && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <Toggle title="Core Web Vitals Report" content={<a href={lighthouseReportUrl} target="_blank" rel="noopener noreferrer">View Report</a>} />
        </div>
      )}

      {/* Core Web Vitals Modal */}
      {isCwvModalOpen && <CoreWebVitalsModal cwv_scores={cwv_scores} onClose={() => setIsCwvModalOpen(false)} />}
    </div>
  );
};

export default Results;
