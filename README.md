# EchoClust - MFCC Environmental Sound Clustering Prototype

This is a 20-30% MERN-stack prototype for an unsupervised audio clustering pipeline. It demonstrates an end-to-end flow:
1. Uploading multiple audio files (.wav, .mp3).
2. Extracting MFCC features using Python (`librosa`).
3. Running K-Means clustering.
4. Reducing dimensionality via PCA for a 2D scatter plot.
5. Displaying the results in a polished, dark-mode React UI.

## Technology Stack
- **Frontend**: React (Vite), Tailwind CSS (v3), Shadcn UI, Recharts, Wavesurfer.js
- **Backend**: Node.js, Express, Multer
- **Database**: MongoDB (Mongoose)
- **Signal Processing**: Python (Librosa, Scikit-learn, Numpy)

---

## Setup Instructions

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.8+)
- **MongoDB** (Local instance running at `mongodb://localhost:27017` or via Atlas)

### 2. Python Environment Setup
We recommend using a virtual environment.
```bash
cd server
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
pip install -r scripts/requirements.txt
```

### 3. Backend Setup
In a new terminal:
```bash
cd server
npm install
npm run dev # Starts on http://localhost:5000 (Make sure MongoDB is running!)
```
*Note: If using MongoDB Atlas, create a `.env` file in the `server` directory and add `MONGO_URI="your_connection_string"`*

### 4. Frontend Setup
In another terminal:
```bash
cd client
npm install
npm run dev # Starts on http://localhost:5173
```

---

## Test Data Generation (Optional)
If you don't have audio files handy, you can generate simple synthetic sine waves (which cluster very distinctly) using the provided helper script:
```bash
cd server
python3 scripts/generate_test_audio.py
```
This will create some `.wav` files in a `test_audio` folder which you can drag and drop into the UI.
