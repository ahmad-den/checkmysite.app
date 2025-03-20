import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import Queue from 'bull';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

const REPORTS_DIR = path.join(__dirname, 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR);
}

const sanitizeUrlForFilename = (url) => url.replace(/[^a-zA-Z0-9]/g, '_');

const lighthouseQueue = new Queue('lighthouseQueue');

// Lighthouse configuration settings
const getLighthouseConfig = (formFactor = 'mobile') => {
  const baseConfig = {
    extends: 'lighthouse:default',
    settings: {
      output: 'html',
      onlyCategories: ['performance'],
      formFactor: formFactor,
      screenEmulation: {
        mobile: formFactor === 'mobile',
        width: formFactor === 'mobile' ? 360 : 1350,
        height: formFactor === 'mobile' ? 640 : 940,
        deviceScaleFactor: formFactor === 'mobile' ? 2.625 : 1,
        disabled: false,
      },
      emulatedUserAgent: formFactor === 'mobile' 
        ? 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Safari/537.36',
      throttling: {
        // Disable network throttling
        downloadThroughputKbps: 0,  // No throttling
        uploadThroughputKbps: 0,    // No throttling
        rttMs: 0,                   // No latency
        
        // Disable CPU throttling
        cpuSlowdownMultiplier: 1,   // No CPU slowdown
      },
      throttlingMethod: 'provided', // Use actual network conditions
    },
  };

  return baseConfig;
};

const runLighthouse = async (url) => {
  let browser;
  try {
    console.log(`Launching headless Chrome for URL: ${url}`);
    browser = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    console.log('Running Lighthouse for mobile emulation...');
    const config = getLighthouseConfig('mobile');
    
    const result = await lighthouse(url, {
      ...config.settings,
      port: browser.port,
    });

    console.log('Lighthouse run completed successfully.');
    return result;
  } catch (error) {
    console.error('Error running Lighthouse:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('Closing Chrome browser...');
      await browser.kill();
    }
  }
};

lighthouseQueue.process(async (job) => {
  const { url, timestamp, sanitizedUrl } = job.data;
  const mobileReportFileName = `${sanitizedUrl}_mobile_${timestamp}.html`;

  try {
    const result = await runLighthouse(url);
    fs.writeFileSync(path.join(REPORTS_DIR, mobileReportFileName), result.report);
    console.log(`Lighthouse mobile report saved: ${mobileReportFileName}`);
    return { mobileReportFileName };
  } catch (error) {
    console.error('Error processing job:', error);
    throw error;
  }
});

app.post('/lighthouse/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    console.error('No URL provided.');
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    const timestamp = Date.now();
    const sanitizedUrl = sanitizeUrlForFilename(url);
    console.log(`Queuing Lighthouse for URL: ${url}`);
    
    // Add job to the queue
    const job = await lighthouseQueue.add({ url, timestamp, sanitizedUrl });
    
    // Return the jobId and reportUrl
    return res.status(200).json({
      message: 'Lighthouse job queued successfully',
      jobId: job.id,
      reportUrl: `/reports/${sanitizedUrl}_mobile_${timestamp}.html`,
    });
  } catch (error) {
    console.error('Error queuing Lighthouse report:', error);
    return res.status(500).json({ message: 'Error queuing report' });
  }
});

app.get('/lighthouse/status/:jobId', async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await lighthouseQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ status: 'not found' });
    }

    const jobState = await job.getState();
    const isCompleted = jobState === 'completed';
    
    if (isCompleted) {
      const result = await job.finished();
      return res.status(200).json({ status: 'completed', result });
    }
    
    return res.status(200).json({ status: jobState });
  } catch (error) {
    console.error('Error checking job status:', error);
    return res.status(500).json({ message: 'Error checking job status' });
  }
});

// Serve the static reports
app.use('/reports', express.static(REPORTS_DIR));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
