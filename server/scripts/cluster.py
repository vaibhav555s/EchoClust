import sys
import json
import librosa
import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
import warnings

# Suppress warnings from librosa and scikit-learn for clean JSON stdout
warnings.filterwarnings('ignore')

def extract_features(file_path, n_mfcc=13):
    try:
        # Load audio file: resample to 22050Hz, convert to mono
        y, sr = librosa.load(file_path, sr=22050, mono=True)
        # Normalize audio
        y = librosa.util.normalize(y)
        # Extract MFCCs
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
        
        # Aggregate features: mean and variance across time
        mfccs_mean = np.mean(mfccs, axis=1)
        mfccs_var = np.var(mfccs, axis=1)
        
        # Combine into a single feature vector
        feature_vector = np.concatenate((mfccs_mean, mfccs_var))
        return feature_vector
    except Exception as e:
        # We handle error at the dataset level, but log to stderr
        print(f"Error processing {file_path}: {e}", file=sys.stderr)
        return None

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python cluster.py <k_clusters> <file1> <file2> ..."}))
        sys.exit(1)

    try:
        k = int(sys.argv[1])
    except ValueError:
        print(json.dumps({"error": "Invalid k_clusters"}))
        sys.exit(1)

    file_paths = sys.argv[2:]
    if len(file_paths) < 3:
        print(json.dumps({"error": "At least 3 files required for clustering."}))
        sys.exit(1)

    # 1. Extract features for each file
    features = []
    valid_files = []
    for fp in file_paths:
        feat = extract_features(fp)
        if feat is not None:
            features.append(feat)
            valid_files.append(fp)

    if len(features) < k:
        print(json.dumps({"error": f"Not enough valid audio files to form {k} clusters."}))
        sys.exit(1)

    X = np.array(features)

    # 2. Run K-Means Clustering
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    cluster_ids = kmeans.fit_predict(X)

    # 3. Compute Silhouette Score
    # Silhouette score requires at least 2 clusters and >2 samples
    if k > 1 and len(X) > k:
        sil_score = float(silhouette_score(X, cluster_ids))
    else:
        sil_score = None

    # 4. Dimensionality Reduction with PCA to 2D
    pca = PCA(n_components=2)
    X_2d = pca.fit_transform(X)

    # 5. Format Output
    clusters_output = []
    for i in range(len(valid_files)):
        clusters_output.append({
            "filename": valid_files[i].split('/')[-1],
            "filePath": valid_files[i],
            "clusterId": int(cluster_ids[i]),
            "x": float(X_2d[i, 0]),
            "y": float(X_2d[i, 1])
        })

    result = {
        "clusters": clusters_output,
        "silhouetteScore": sil_score
    }

    # Print exact JSON to stdout
    print(json.dumps(result))

if __name__ == "__main__":
    main()
