import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Shield, 
  Clock, 
  CheckCircle, 
  Star, 
  ArrowRight, 
  ChevronDown,
  Users,
  FileCheck,
  CreditCard,
  Bell,
  Menu,
  X,
  Play,
  Pause,
  Sparkles,
  Zap,
  Heart,
  Award,
  Globe,
  Lock,
  Timer,
  PieChart,
  TrendingUp
} from 'lucide-react';
import config from '../../lib/config';

// Animated counter component
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// 3D floating card component
function FloatingCard3D({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
        <div className="relative glass-card p-8 rounded-2xl border border-white/5">
          {children}
        </div>
      </div>
    </div>
  );
}

// Particle background effect
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.05
      });
    }

    let animationId: number;
    
    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// Glowing orb effect
function GlowingOrb({ color, size, position }: { color: string; size: string; position: string }) {
  return (
    <div
      className={`absolute ${size} ${position} rounded-full blur-3xl opacity-10 animate-pulse`}
      style={{ backgroundColor: color }}
    />
  );
}

export function MarketingLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: FileCheck,
      title: 'Smart Document Processing',
      description: 'AI-powered document verification with 99.9% accuracy rate. Automatically extract and validate all loan-related documents.',
      color: '#D4AF37'
    },
    {
      icon: Clock,
      title: 'Real-time Tracking',
      description: 'Track your application status in real-time. Get instant notifications at every milestone of your NOI process.',
      color: '#B8860B'
    },
    {
      icon: Shield,
      title: 'Bank-grade Security',
      description: 'Your data is protected by enterprise-grade encryption and strictly enforced Row-Level Security (RLS).',
      color: '#F4D03F'
    },
    {
      icon: Users,
      title: 'Collaborative Workflow',
      description: 'Seamless communication between applicants, advisors, and bank staff to accelerate the loan origination cycle.',
      color: '#996515'
    }
  ];

  const stats = [
    { value: 15000, label: 'Cases Processed', suffix: '+' },
    { value: 99.9, label: 'Accuracy Rate', suffix: '%' },
    { value: 24, label: 'Avg. Filing Time', suffix: 'h' },
    { value: 15, label: 'Banking Partners', suffix: '+' }
  ];

  const testimonials = [
    {
      name: 'Aditi Rao',
      role: 'Loan Officer, HDFC Bank',
      content: 'AG Associates has transformed how we handle NOI filings. The efficiency improvement is remarkable.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Suresh Patil',
      role: 'Property Consultant',
      content: 'The glassmorphic interface is not just beautiful - it makes my work so much easier. Highly recommended!',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Amit Patel',
      role: 'Legal Advisor',
      content: 'Finally, a platform that understands the nuances of property registration in India. Exceptional service!',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] overflow-x-hidden">
      <ParticleField />
      <GlowingOrb color="#D4AF37" size="w-[500px] h-[500px]" position="top-[-100px] left-[-100px]" />
      <GlowingOrb color="#B8860B" size="w-[400px] h-[400px]" position="bottom-[10%] right-[-100px]" />

      {/* Navigation */}
      <nav className="relative z-50 glass-nav mx-6 mt-6 px-6 py-4 rounded-2xl flex items-center justify-between border border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-white flex items-center justify-center text-white">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold leading-tight uppercase tracking-tighter text-sm">{config.app.name}</h2>
            <span className="text-[9px] uppercase text-amber-500 font-mono tracking-widest mt-0.5 block">Legal Excellence</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {['Features', 'Process', 'Testimonials'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-white/50 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">
              {item}
            </a>
          ))}
          <Link to="/login" className="px-6 py-2 border border-white text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Enter Portal
          </Link>
        </div>

        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 border border-amber-500/20 text-amber-500 text-[9px] font-bold uppercase tracking-[0.3em] mb-12">
              <Sparkles size={12} className="inline mr-2" />
              Autonomous Legal Operations
            </span>
            <h1 className="text-5xl md:text-9xl font-bold text-white mb-10 tracking-tighter leading-[0.9]">
              Precision <br />
              <span className="text-gray-600">at Scale.</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto mb-16 leading-relaxed font-light tracking-wide">
              AG Associates provides an autonomous operating system for property law firms and bank panel advocates.
              Eliminate human overhead and blitzscale your operations with luxurious restraint.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/login" className="px-10 py-4 bg-white text-black font-bold text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all">
                Access Dashboard
              </Link>
              <a href="mailto:partnerships@agassociates.in" className="px-10 py-4 border border-[#1F1F1F] text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 transition-all">
                Request Integration
              </a>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="relative z-10 py-32 border-y border-[#1F1F1F] bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tighter">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-40 bg-obsidian">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-32">
            <h2 className="text-4xl md:text-7xl font-bold text-white mb-8 tracking-tighter">The Operating System.</h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto font-light tracking-wide">Every module designed for zero human intervention. Rigid, precise, autonomous.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1F1F1F] border border-[#1F1F1F]">
            {features.map((feature, i) => (
              <div key={i} className="bg-obsidian p-12 hover:bg-white/5 transition-all group">
                <div className="w-12 h-12 border border-[#1F1F1F] flex items-center justify-center mb-12 group-hover:border-white transition-colors">
                  <feature.icon size={20} className="text-white" />
                </div>
                <h3 className="text-white font-bold text-[11px] uppercase tracking-widest mb-4">{feature.title}</h3>
                <p className="text-gray-500 text-xs font-light leading-relaxed tracking-wide">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 py-40 border-t border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
            <div className="max-w-2xl">
              <span className="text-amber-500 font-bold uppercase tracking-widest text-[10px] mb-6 block">Verification</span>
              <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tighter">Trusted by Institutions.</h2>
            </div>
            <Link to="/login" className="px-10 py-4 border border-white text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              View Case Studies
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-[#1F1F1F] border border-[#1F1F1F]">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-obsidian p-12 flex flex-col justify-between hover:bg-white/5 transition-all">
                <div>
                  <div className="flex gap-1 mb-8">
                    {[...Array(t.rating)].map((_, i) => <Star key={i} size={12} className="fill-white text-white" />)}
                  </div>
                  <p className="text-gray-400 text-base italic font-light leading-relaxed mb-12">"{t.content}"</p>
                </div>
                <div className="flex items-center gap-5">
                  <img src={t.image} alt={t.name} className="w-10 h-10 rounded-sm object-cover border border-[#1F1F1F]" />
                  <div>
                    <h4 className="text-white font-bold text-[10px] uppercase tracking-widest">{t.name}</h4>
                    <p className="text-gray-600 text-[9px] uppercase tracking-widest mt-1">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <footer className="relative z-10 pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="p-16 md:p-32 border border-[#1F1F1F] text-center relative overflow-hidden mb-32 bg-[#0A0A0A]">
            <h2 className="text-5xl md:text-8xl font-bold text-white mb-10 tracking-tighter">Decouple Growth.</h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto mb-16 font-light tracking-wide">Join the future of legal operations today. Autonomous intelligence for the modern firm.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/login" className="px-12 py-5 bg-white text-black font-bold text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all">
                Initialize System
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-16 mb-32 pt-24 border-t border-[#1F1F1F]">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 border border-white flex items-center justify-center text-white">
                  <Building2 size={20} />
                </div>
                <h3 className="text-white text-xl font-bold uppercase tracking-tighter">AG ASSOCIATES</h3>
              </div>
              <p className="text-gray-600 text-sm max-w-sm leading-relaxed font-light tracking-wide">
                India's premier digital workforce for legal and banking operations.
                Architecting precision at scale through autonomous agentic workflows.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px] mb-10">System</h4>
              <ul className="space-y-6 text-gray-600 text-[10px] uppercase tracking-[0.2em] font-bold">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Portal</Link></li>
                <li><a href="https://dashboard.advadiityagade.com" className="hover:text-white transition-colors">AI Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px] mb-10">Command</h4>
              <ul className="space-y-6 text-gray-600 text-[10px] font-bold tracking-widest">
                <li>partnerships@agassociates.in</li>
                <li>+91 96992 18421</li>
                <li>Thane, Maharashtra</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-[#1F1F1F]">
            <p className="text-gray-700 text-[9px] uppercase tracking-[0.4em] font-bold">
              © {new Date().getFullYear()} AG ASSOCIATES · LUXORANOVA INTEL
            </p>
            <div className="flex gap-10">
              <Link to="/privacy" className="text-gray-700 text-[9px] uppercase tracking-[0.4em] font-bold hover:text-white transition-colors">Privacy</Link>
              <a href="#" className="text-gray-700 text-[9px] uppercase tracking-[0.4em] font-bold hover:text-white transition-colors">Legal</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
