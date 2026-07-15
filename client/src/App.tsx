import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { AudioLines, History, UploadCloud } from 'lucide-react';
import { useEffect } from 'react';

function Navbar() {
  const location = useLocation();
  const navItems = [
    { name: 'Upload', path: '/', icon: UploadCloud },
    { name: 'History', path: '/history', icon: History },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
            <AudioLines className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            EchoClust
          </span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Prototype
          </span>
        </div>
        <div className="flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2",
                location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

function App() {
  // Enforce dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0c] text-foreground font-sans antialiased selection:bg-primary/30 relative overflow-hidden">
        {/* Subtle ambient gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-6 pt-24 pb-12 relative z-10">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/results/:batchId" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>

        <Toaster />
      </div>
    </Router>
  );
}

export default App;
