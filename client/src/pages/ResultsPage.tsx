import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRun } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BarChart3, ListMusic, BrainCircuit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ClusterPoint {
  filename: string;
  clusterId: number;
  x: number;
  y: number;
}

interface Batch {
  _id: string;
  status: string;
  clusters: ClusterPoint[];
  silhouetteScore: number | null;
  createdAt: string;
}

// Generate pleasing colors for up to 10 clusters
const CLUSTER_COLORS = [
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#f43f5e', // Rose
];

export default function ResultsPage() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (batchId) {
      getRun(batchId)
        .then(setBatch)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [batchId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <Skeleton className="h-10 w-48 bg-white/5" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[500px] bg-white/5 rounded-xl" />
          <div className="space-y-6">
            <Skeleton className="h-32 bg-white/5 rounded-xl" />
            <Skeleton className="h-[344px] bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!batch || batch.status !== 'done') {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold mb-2">Results not available</h2>
        <p className="text-muted-foreground mb-6">This batch might still be processing or encountered an error.</p>
        <Link to="/" className="text-primary hover:underline flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Upload
        </Link>
      </div>
    );
  }

  // Process data for chart
  // Group by clusterId for the Legend to work cleanly with Scatter
  const clustersData = Array.from(new Set(batch.clusters.map(c => c.clusterId))).sort().map(id => {
    return {
      name: `Cluster ${id}`,
      data: batch.clusters.filter(c => c.clusterId === id),
      fill: CLUSTER_COLORS[id % CLUSTER_COLORS.length]
    };
  });

  const getSilhouetteInterpretation = (score: number | null) => {
    if (score === null) return "N/A (Too few clusters)";
    if (score > 0.5) return "Strong structure";
    if (score > 0.25) return "Moderate structure";
    return "Weak structure";
  };

  const getHeuristicDescription = (clusterId: number) => {
    // In a real app, you might analyze cluster centroids to label them.
    // Here we provide generic descriptions for the prototype.
    const descriptions = [
      "Likely continuous background noise",
      "Short, impulsive sounds",
      "Harmonic or tonal content",
      "Low-frequency rumble",
      "Complex broadband noise"
    ];
    return descriptions[clusterId % descriptions.length];
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clustering Results</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Run ID: <span className="font-mono text-xs">{batch._id}</span>
          </p>
        </div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-white flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> New Batch
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PCA Scatter Plot */}
        <Card className="lg:col-span-2 bg-black/20 border-white/10 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
              2D PCA Visualization
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" dataKey="x" name="PCA 1" tick={{ fill: 'rgba(255,255,255,0.5)' }} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} />
                <YAxis type="number" dataKey="y" name="PCA 2" tick={{ fill: 'rgba(255,255,255,0.5)' }} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background/95 border border-white/20 p-3 rounded-lg shadow-xl backdrop-blur-md">
                          <p className="font-medium text-sm mb-1">{data.filename}</p>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[data.clusterId % CLUSTER_COLORS.length] }} />
                            <p className="text-xs text-muted-foreground">Cluster {data.clusterId}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {clustersData.map((cluster) => (
                  <Scatter key={cluster.name} name={cluster.name} data={cluster.data} fill={cluster.fill}>
                    {cluster.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={cluster.fill} />
                    ))}
                  </Scatter>
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Stat Card */}
          <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" />
                Silhouette Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {batch.silhouetteScore ? batch.silhouetteScore.toFixed(3) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {getSilhouetteInterpretation(batch.silhouetteScore)}
              </p>
            </CardContent>
          </Card>

          {/* Results Table Summary */}
          <Card className="bg-white/5 border-white/10 shadow-xl flex-1 flex flex-col h-[326px]">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-primary" />
                File Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                  <TableRow className="border-white/10">
                    <TableHead>File</TableHead>
                    <TableHead className="text-right">Cluster</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.clusters.map((item, idx) => (
                    <TableRow key={idx} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-medium text-xs max-w-[120px] truncate" title={item.filename}>
                        {item.filename}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: CLUSTER_COLORS[item.clusterId % CLUSTER_COLORS.length], color: CLUSTER_COLORS[item.clusterId % CLUSTER_COLORS.length] }}
                          className="bg-black/20"
                        >
                          C{item.clusterId}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Cluster Details Table */}
      <Card className="bg-black/20 border-white/10 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">Cluster Interpretations (Heuristic)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="w-[100px]">Cluster ID</TableHead>
                <TableHead>Suggested Label</TableHead>
                <TableHead className="text-right">File Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clustersData.map((cluster) => (
                <TableRow key={cluster.name} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <Badge style={{ backgroundColor: cluster.fill }} className="text-white">
                      {cluster.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {getHeuristicDescription(parseInt(cluster.name.replace('Cluster ', '')))}
                  </TableCell>
                  <TableCell className="text-right font-medium">{cluster.data.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
