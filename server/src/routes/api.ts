import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { spawn } from 'child_process';
import Batch from '../models/Batch';
import fs from 'fs';

const router = Router();

// Configure Multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\\s+/g, '_'));
  }
});
const upload = multer({ storage });

// 1. Upload API
router.post('/upload', upload.array('files'), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const filePaths = files.map(f => f.path);

    const newBatch = new Batch({
      status: 'processing',
      files: filePaths,
    });
    
    await newBatch.save();
    res.json({ batchId: newBatch._id });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload files.' });
  }
});

// 2. Cluster API
router.post('/cluster/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { k = 4 } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found.' });
    }

    if (batch.files.length < 3) {
      batch.status = 'error';
      batch.errorMessage = 'At least 3 files required for clustering.';
      await batch.save();
      return res.status(400).json({ error: batch.errorMessage });
    }

    // Spawn Python process
    const pythonScriptPath = path.join(__dirname, '../../scripts/cluster.py');
    const pythonProcess = spawn('python3', [pythonScriptPath, k.toString(), ...batch.files]);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}: ${stderrData}`);
        batch.status = 'error';
        batch.errorMessage = `Python execution failed. ${stderrData.substring(0, 200)}`;
        await batch.save();
        return res.status(500).json({ error: 'Clustering process failed.', details: stderrData });
      }

      try {
        const result = JSON.parse(stdoutData);
        if (result.error) {
          batch.status = 'error';
          batch.errorMessage = result.error;
          await batch.save();
          return res.status(400).json({ error: result.error });
        }

        batch.status = 'done';
        batch.clusters = result.clusters;
        batch.silhouetteScore = result.silhouetteScore;
        await batch.save();

        res.json({ batch });
      } catch (parseError) {
        console.error('Failed to parse Python output:', stdoutData);
        batch.status = 'error';
        batch.errorMessage = 'Failed to parse clustering results.';
        await batch.save();
        res.status(500).json({ error: 'Failed to parse clustering results.' });
      }
    });

  } catch (error) {
    console.error('Cluster Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// 3. Get Runs API
router.get('/runs', async (req, res) => {
  try {
    const runs = await Batch.find().sort({ createdAt: -1 }).limit(20);
    res.json({ runs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch runs.' });
  }
});

// 4. Get Single Run API
router.get('/runs/:id', async (req, res) => {
  try {
    const run = await Batch.findById(req.params.id);
    if (!run) return res.status(404).json({ error: 'Not found' });
    res.json({ run });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch run.' });
  }
});

// 5. Serve Audio Files
router.get('/audio/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../../uploads', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Not found');
  }
});

export default router;
