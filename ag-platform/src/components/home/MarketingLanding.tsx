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
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
        <div className="relative glass-card p-8 rounded-2xl">
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
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1
      });
    }

    let animationId: number;
    
    function animate() {
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
      className={`absolute ${size} ${position} rounded-full blur-3xl opacity-20 animate-pulse`}
      style={{ backgroundColor: color }}
    />
  );
}

export function MarketingLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

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
      icon: Shield,
      title: 'Bank-grade Security',
      description: 'Enterprise-level encryption and secure data handling. Your sensitive information is protected at every step.',
      color: '#10b981'
    },
    {
      icon: Bell,
      title: 'Instant Notifications',
      description: 'Stay updated with WhatsApp, SMS, and email notifications. Never miss an important update on your application.',
      color: '#f59e0b'
    }
  ];

  const stats = [
    { label: 'Active Users', value: 2500, suffix: '+', icon: Users },
    { label: 'NOI Filed', value: 15000, suffix: '+', icon: FileCheck },
    { label: 'Success Rate', value: 98.5, suffix: '%', icon: TrendingUp },
    { label: 'Avg. Processing Time', value: 24, suffix: 'hrs', icon: Timer }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Branch Manager, HDFC Bank',
      content: 'AG Associates has transformed how we handle NOI filings. The efficiency improvement is remarkable.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Priya Sharma',
      role: 'Property Consultant',
      content: 'The glassmorphic interface is not just beautiful - it makes my work so much easier. Highly recommended!',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Amit Patel',
      role: 'Legal Advisor',
      content: 'Finally, a platform that understands the nuances of property registration in India. Exceptional service!',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    }
  ];

  const processSteps = [
    {
      step: 1,
      icon: FileCheck,
      title: 'Document Submission',
      description: 'Upload your sanction letter and property documents through our secure portal',
      color: '#8b5cf6'
    },
    {
      step: 2,
      icon: CreditCard,
      title: 'Challan Generation',
      description: 'System automatically calculates applicable fees and generates challan',
      color: '#06b6d4'
    },
    {
      step: 3,
      icon: CreditCard,
      title: 'Payment Processing',
      description: 'Pay Stamp Duty & Registration fees securely online',
      color: '#10b981'
    },
    {
      step: 4,
      icon: Award,
      title: 'NOI Filing',
      description: 'We file your Notice of Intimation with the registrar',
      color: '#f59e0b'
    },
    {
      step: 5,
      icon: CheckCircle,
      title: 'Acknowledgment',
      description: 'Receive your filed NOI acknowledgment instantly',
      color: '#ec4899'
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <ParticleField />
      <GlowingOrb color="#8b5cf6" size="w-[600px] h-[600px]" position="top-[-200px] left-[-200px]" />
      <GlowingOrb color="#06b6d4" size="w-[500px] h-[500px]" position="top-[20%] right-[-150px]" />
      <GlowingOrb color="#10b981" size="w-[400px] h-[400px]" position="bottom-[10%] left-[10%]" />

      {/* Navigation */}
      <nav className="relative z-50 glass-nav border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl blur-lg animate-pulse" />
                <div className="relative bg-gradient-to-br from-violet-500 to-indigo-500 text-white p-2 rounded-xl shadow-lg">
                  <Building2 size={22} />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-serif font-bold text-white leading-none">AG Associates</h1>
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/50">Legal Excellence</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <a href="#features" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5">Features</a>
              <a href="#process" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5">Process</a>
              <a href="#testimonials" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5">Testimonials</a>
              <a href="#pricing" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5">Pricing</a>
              <Link to="/login" className="ml-4 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-violet-500/25">
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-white/70 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden glass-card mx-4 my-2 p-4 rounded-xl">
            <div className="flex flex-col space-y-2">
              <a href="#features" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg">Features</a>
              <a href="#process" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg">Process</a>
              <a href="#testimonials" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg">Testimonials</a>
              <a href="#pricing" className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg">Pricing</a>
              <Link to="/login" className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-center font-medium rounded-lg mt-2">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 glass-badge mb-6">
                <Sparkles size={14} className="text-violet-400" />
                <span className="text-sm">#1 NOI Processing Platform in India</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                <span className="bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
                  File Your NOI
                </span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  With Confidence
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/70 mb-8 max-w-xl mx-auto lg:mx-0">
                Experience the future of property registration. Our intelligent platform transforms complex NOI filings into simple, paperless processes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  to="/login"
                  className="group px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Start Filing Now
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button 
                  onClick={() => setShowVideo(true)}
                  className="px-8 py-4 glass-button flex items-center justify-center gap-2"
                >
                  <Play size={18} />
                  Watch Demo
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=40&h=40&fit=crop&crop=face'
                  ].map((src, i) => (
                    <img key={i} src={src} alt="" className="w-10 h-10 rounded-full border-2 border-white/20 object-cover" />
                  ))}
                </div>
                <div className="text-sm text-white/70">
                  <span className="text-white font-semibold">2,500+</span> happy users
                </div>
              </div>
            </div>

            {/* Right - Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main card */}
                <div className="relative z-10 glass-card p-8 rounded-3xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <FileCheck size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">NOI Filed Successfully</h3>
                      <p className="text-sm text-white/50">Property Registration Complete</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <span className="text-white/70">Status</span>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Verified</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <span className="text-white/70">Challan Amount</span>
                      <span className="text-white font-semibold">₹45,280</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <span className="text-white/70">Processing Time</span>
                      <span className="text-white font-semibold">24 Hours</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                        <CheckCircle size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">All Documents Verified</p>
                        <p className="text-xs text-white/50">Ready for final submission</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 glass-card px-4 py-2 rounded-xl animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-sm text-white">Instant Approval</span>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 glass-card px-4 py-2 rounded-xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-violet-400" />
                    <span className="text-sm text-white">100% Secure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-8 md:p-12 rounded-3xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center">
                    <stat.icon size={28} className="text-violet-400" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-white/50">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 glass-badge mb-4">
              <Zap size={14} className="inline mr-1 text-yellow-400" />
              Powerful Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Everything You Need for{' '}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                NOI Filing
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Our comprehensive platform handles every aspect of Notice of Intimation filing, 
              from document collection to final acknowledgment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <FloatingCard3D key={i} delay={i * 100}>
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <feature.icon size={28} style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </FloatingCard3D>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 glass-badge mb-4">
              <Timer size={14} className="inline mr-1 text-cyan-400" />
              Simple Process
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              File Your NOI in{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                5 Easy Steps
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              We've streamlined the entire process to get your Notice of Intimation filed quickly and efficiently.
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 transform -translate-y-1/2 rounded-full" />

            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
              {processSteps.map((step, i) => (
                <div key={i} className="relative">
                  <div className="glass-card p-6 rounded-2xl text-center relative z-10">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold"
                      style={{ backgroundColor: step.color }}
                    >
                      {step.step}
                    </div>
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: `${step.color}20` }}
                    >
                      <step.icon size={24} style={{ color: step.color }} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-white/60">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 glass-badge mb-4">
              <Heart size={14} className="inline mr-1 text-pink-400" />
              Testimonials
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Loved by{' '}
              <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                Professionals
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="glass-card p-8 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-violet-500/30"
                  />
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-white/50">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/70 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 glass-badge mb-4">
              <CreditCard size={14} className="inline mr-1 text-emerald-400" />
              Transparent Pricing
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Simple,{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Affordable
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <div className="glass-card p-8 rounded-2xl">
              <h3 className="text-xl font-semibold text-white mb-2">Starter</h3>
              <p className="text-white/50 mb-6">For individual property owners</p>
              <div className="text-4xl font-bold text-white mb-6">
                ₹999<span className="text-lg text-white/50">/case</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Document verification', 'Challan generation', 'Email support', 'Basic tracking'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/70">
                    <CheckCircle size={16} className="text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="block w-full py-3 text-center glass-button">
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative glass-card p-8 rounded-2xl border-2 border-violet-500/50">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-full">
                  Most Popular
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Professional</h3>
              <p className="text-white/50 mb-6">For legal practitioners & agents</p>
              <div className="text-4xl font-bold text-white mb-6">
                ₹2,499<span className="text-lg text-white/50">/case</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Everything in Starter', 'Priority processing', 'WhatsApp notifications', 'Bulk filing', 'API access'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/70">
                    <CheckCircle size={16} className="text-violet-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="block w-full py-3 text-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all">
                Get Started
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="glass-card p-8 rounded-2xl">
              <h3 className="text-xl font-semibold text-white mb-2">Enterprise</h3>
              <p className="text-white/50 mb-6">For banks & large organizations</p>
              <div className="text-4xl font-bold text-white mb-6">
                Custom<span className="text-lg text-white/50"> pricing</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Everything in Professional', 'Dedicated account manager', 'Custom integration', 'SLA guarantee', '24/7 support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/70">
                    <CheckCircle size={16} className="text-blue-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="block w-full py-3 text-center glass-button">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl blur-xl opacity-30" />
            <div className="relative glass-card p-12 md:p-16 rounded-3xl text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Globe size={40} className="text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your NOI Process?
              </h2>
              <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
                Join thousands of legal professionals and property owners who trust AG Associates for their NOI filing needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/login"
                  className="group px-8 py-4 bg-white text-violet-900 font-semibold rounded-2xl hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a 
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 glass-button flex items-center justify-center gap-2"
                >
                  <span>Talk to Us</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 glass-card mx-6 mb-6 p-8 rounded-2xl">
        <div className="grid md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">AG Associates</h3>
                <span className="text-[10px] uppercase text-white/50">Legal Excellence</span>
              </div>
            </div>
            <p className="text-white/60 text-sm">
              Your trusted partner for property registration and NOI filing services across India.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#process" className="hover:text-white transition-colors">Process</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li>contact@advadiityagade.com</li>
              <li>+91 98765 43210</li>
              <li>Mumbai, Maharashtra</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            © 2024 AG Associates. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 glass-button rounded-full flex items-center justify-center">
              <Globe size={18} />
            </a>
            <a href="#" className="w-10 h-10 glass-button rounded-full flex items-center justify-center">
              <Heart size={18} />
            </a>
            <a href="#" className="w-10 h-10 glass-button rounded-full flex items-center justify-center">
              <Award size={18} />
            </a>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
      >
        <ChevronDown size={20} className="transform rotate-180" />
      </button>
    </div>
  );
}