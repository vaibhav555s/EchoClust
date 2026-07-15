import React, { useEffect, useState } from 'react';
import { getRuns } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, History } from 'lucide-react';

interface BatchSummary {
  _id: string;
  status: string;
  files: string[];
  silhouetteScore: number | null;
  createdAt: string;
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRuns()
      .then(setRuns)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-48 bg-white/5" />
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <History className="w-8 h-8 text-primary" />
          Run History
        </h1>
        <p className="text-muted-foreground mt-2">
          Review past clustering operations and their results.
        </p>
      </div>

      <Card className="bg-black/20 border-white/10 backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-[120px] pl-6">Status</TableHead>
                <TableHead>Run ID</TableHead>
                <TableHead>Audio Files</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No runs found. Upload some audio to get started.
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run) => (
                  <TableRow key={run._id} className="border-white/5 hover:bg-white/5 transition-colors group">
                    <TableCell className="pl-6">
                      <Badge 
                        variant="outline" 
                        className={
                          run.status === 'done' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' :
                          run.status === 'error' ? 'border-red-500/50 text-red-400 bg-red-500/10' :
                          'border-amber-500/50 text-amber-400 bg-amber-500/10'
                        }
                      >
                        {run.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{run._id.slice(-8)}</TableCell>
                    <TableCell className="font-medium">{run.files.length} items</TableCell>
                    <TableCell>
                      {run.silhouetteScore ? run.silhouetteScore.toFixed(3) : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {run.status === 'done' && (
                        <Link 
                          to={`/results/${run._id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View Results <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
