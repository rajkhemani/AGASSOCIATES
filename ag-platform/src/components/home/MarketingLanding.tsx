import { useState, useEffect, useRef } from "react";
import { 
  Shield, 
  Zap,
  FileCheck,
  Clock,
  Scale,
  Building2,
  ChevronRight,
  Play
} from "lucide-react";
import { Button, Card } from "@ag/ui";

export function MarketingLanding() {
  const [showVideo, setShowVideo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  console.log(showVideo); // Avoid unused warning

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1
      });
    }

    let animationId: number;
    
    function animate() {
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
          ctx.fill();
        });
      }
      animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const features = [
    {
      icon: FileCheck,
      title: 'Smart Document Processing',
      description: 'AI-powered document verification with 99.9% accuracy rate. Automatically extract and validate all loan-related documents.',
      color: '#8b5cf6'
    },
    {
      icon: Clock,
      title: 'Real-time Tracking',
      description: 'Track your application status in real-time. Get instant notifications at every milestone of your NOI process.',
      color: '#06b6d4'
    },
    {
      icon: Scale,
      title: 'Legal Compliance',
      description: 'Built-in legal validation engine ensures every NOI filing adheres to the latest government regulations.',
      color: '#10b981'
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none opacity-40"
      />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 border-b border-slate-800/50 backdrop-blur-md bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight uppercase">AG Associates</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400">
          <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
          <a href="#about" className="hover:text-indigo-400 transition-colors">Solutions</a>
          <a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a>
          <Button variant="outline" className="border-slate-800 hover:bg-slate-900" onClick={() => window.location.href='/login'}>
            Log In
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/20">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3" /> Powered by Luxor9 AI Engine
            </div>

            <h1 className="text-6xl md:text-8xl font-black leading-tight tracking-tighter">
              Legal Operations <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Redefined</span>
            </h1>

            <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
              The only end-to-end legal infrastructure designed specifically for bank panel advocates in Maharashtra. Automate NOI, challan generation, and filing in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 h-16 px-8 text-lg font-bold group shadow-2xl shadow-indigo-500/20">
                Start Free Trial <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="h-16 px-8 text-lg font-bold border-slate-800 bg-slate-900/50 hover:bg-slate-900" onClick={() => setShowVideo(!showVideo)}>
                <Play className="w-5 h-5 mr-2" /> View Demo
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-8 border-t border-slate-800">
              <div>
                <p className="text-3xl font-black">15,000+</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Firms Onboarded</p>
              </div>
              <div className="w-px h-12 bg-slate-800" />
              <div>
                <p className="text-3xl font-black">99.9%</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Uptime SLA</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full" />
            <div className="relative bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden aspect-[4/3] group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                <div className="mx-auto px-4 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  LegalOS Dashboard — v2.0
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="h-4 w-1/3 bg-slate-800 rounded-full animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-slate-800/50 rounded-2xl border border-slate-800 animate-pulse" />
                  <div className="h-32 bg-slate-800/50 rounded-2xl border border-slate-800 animate-pulse" />
                </div>
                <div className="space-y-4">
                   {[1,2,3].map(i => (
                     <div key={i} className="h-12 bg-slate-800/30 rounded-xl border border-slate-800/50 flex items-center px-4 gap-4">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/20" />
                        <div className="h-2 flex-1 bg-slate-800 rounded-full" />
                        <div className="w-12 h-2 bg-slate-800 rounded-full" />
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="relative py-32 px-8 border-t border-slate-900">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Mission Critical Features</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to scale your legal operations without increasing overhead costs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <Card key={i} className="p-8 space-y-6 bg-slate-900/50 border-slate-800 hover:border-indigo-500/50 transition-all group">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${f.color}20`, border: `1px solid ${f.color}40` }}
                >
                  <f.icon className="w-7 h-7" style={{ color: f.color }} />
                </div>
                <h3 className="text-xl font-bold text-white">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{f.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-20 px-8 bg-indigo-600">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white leading-tight">Ready to transform your<br/>legal firm?</h2>
            <p className="text-indigo-100 font-medium">Join over 15,000 advocate firms already using Luxor9.</p>
          </div>
          <div className="flex gap-4">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 font-black h-16 px-10 text-lg shadow-2xl">
              Get Started Now
            </Button>
            <Button variant="outline" size="lg" className="border-indigo-400 text-white hover:bg-indigo-500 font-bold h-16 px-10 text-lg">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-slate-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-6">
             <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
             <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
             <a href="#security" className="hover:text-white transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" /> 256-bit AES Encryption
          </div>
          <div>
            © 2024 AG ASSOCIATES. PROPRIETARY TECHNOLOGY.
          </div>
        </div>
      </footer>
    </div>
  );
}
