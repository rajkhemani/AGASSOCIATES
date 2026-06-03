'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Building2,
  Shield,
  Clock,
  CheckCircle,
  Star,
  ArrowRight,
  ChevronDown,
  Users,
  TrendingUp,
  Lock,
  Globe,
  Award,
  Heart,
  Menu,
  X,
  Play,
  Sparkles,
  BarChart3,
  Handshake,
  Target,
  Zap,
  Crown,
  Gem,
  LineChart
} from 'lucide-react';

// Animated counter
function AnimatedCounter({ end, duration = 2000, suffix = '', prefix = '' }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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
  }, [end, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// Particle background
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasEl = canvas;
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvasEl.width,
        y: Math.random() * canvasEl.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.05
      });
    }

    let animationId: number;

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvasEl.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvasEl.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />;
}

// Glowing orb - Gold/Banking theme
function GlowingOrb({ color, size, position }: { color: string; size: string; position: string }) {
  return (
    <div className={`absolute ${size} ${position} rounded-full blur-3xl opacity-20 animate-pulse`} style={{ backgroundColor: color }} />
  );
}

export default function CorporateLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Premium Banking Services
  const services = [
    {
      icon: Handshake,
      title: 'Corporate Advisory',
      description: 'Strategic financial guidance tailored to enterprise needs with measurable outcomes.',
      color: '#D4AF37' // Gold
    },
    {
      icon: BarChart3,
      title: 'Portfolio Management',
      description: 'Sophisticated investment strategies designed for sustainable growth and risk optimization.',
      color: '#1E3A5F' // Deep Navy
    },
    {
      icon: Shield,
      title: 'Risk Mitigation',
      description: 'Enterprise-grade security protocols and compliance frameworks for institutional operations.',
      color: '#2C5F2D' // Forest Green
    },
    {
      icon: Target,
      title: 'Strategic Planning',
      description: 'Data-driven insights and actionable intelligence for informed decision-making.',
      color: '#4A1942' // Royal Purple
    }
  ];

  const stats = [
    { label: 'Assets Under Advisory', value: 2500, suffix: 'B+', prefix: '₹' },
    { label: 'Corporate Partners', value: 150, suffix: '+' },
    { label: 'Client Retention Rate', value: 98, suffix: '%' },
    { label: 'Years of Excellence', value: 25, suffix: '+' }
  ];

  const processSteps = [
    { step: 1, icon: Target, title: 'Discovery', description: 'Comprehensive analysis of organizational requirements' },
    { step: 2, icon: BarChart3, title: 'Strategy', description: 'Customized financial roadmap development' },
    { step: 3, icon: Handshake, title: 'Implementation', description: 'Seamless execution with continuous monitoring' },
    { step: 4, icon: LineChart, title: 'Optimization', description: 'Ongoing performance refinement and reporting' }
  ];

  const testimonials = [
    {
      name: 'Rajesh Mehta',
      role: 'CFO, Tata Capital',
      content: "The advisory team's expertise and attention to detail has been instrumental in our financial strategy.",
      rating: 5,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Priya Shah',
      role: 'Managing Director, HDFC Bank',
      content: 'A truly world-class experience. Their insights have transformed our approach to corporate finance.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Vikram Singh',
      role: 'CEO, Reliance Industries',
      content: 'Exceptional professionalism and results. They deliver beyond expectations consistently.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    }
  ];

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a18 0%, #12122a 50%, #0d0d1a 100%)' }}>
      <ParticleField />
      <GlowingOrb color="#D4AF37" size="w-[600px] h-[600px]" position="top-[-200px] left-[-200px]" />
      <GlowingOrb color="#1E3A5F" size="w-[500px] h-[500px]" position="top-[20%] right-[-150px]" />
      <GlowingOrb color="#2C5F2D" size="w-[400px] h-[400px]" position="bottom-[10%] left-[10%]" />

      {/* Navigation - Premium Gold Accents */}
      <nav className="relative z-50 border-b" style={{ background: 'rgba(10, 10, 24, 0.8)', backdropFilter: 'blur(20px)', borderColor: 'rgba(212, 175, 55, 0.2)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-yellow-500 rounded-lg blur-lg" style={{ opacity: 0.6 }} />
                <div className="relative bg-gradient-to-br from-amber-600 to-yellow-500 text-white p-2 rounded-lg shadow-lg">
                  <Crown size={22} />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-serif font-bold text-white leading-none tracking-wide">AG ASSOCIATES</h1>
                <span className="text-[9px] uppercase tracking-[0.3em] text-amber-400/70">Premium Financial Advisory</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <a href="#services" className="px-4 py-2 text-sm text-white/70 hover:text-amber-400 transition-colors rounded-lg hover:bg-white/5">Services</a>
              <a href="#process" className="px-4 py-2 text-sm text-white/70 hover:text-amber-400 transition-colors rounded-lg hover:bg-white/5">Approach</a>
              <a href="#testimonials" className="px-4 py-2 text-sm text-white/70 hover:text-amber-400 transition-colors rounded-lg hover:bg-white/5">Testimonials</a>
              <a href="#contact" className="px-4 py-2 text-sm text-white/70 hover:text-amber-400 transition-colors rounded-lg hover:bg-white/5">Contact</a>
              <Link href="/dashboard" className="ml-4 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-sm font-medium rounded-lg hover:from-amber-500 hover:to-yellow-500 transition-all shadow-lg shadow-amber-500/25 tracking-wide">
                Client Portal
              </Link>
            </div>

            <button className="md:hidden p-2 text-white/70 hover:text-amber-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden px-4 pb-4" style={{ background: 'rgba(10,10,24,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
            <div className="flex flex-col space-y-2">
              <a href="#services" className="px-4 py-2 text-white/70 hover:text-amber-400">Services</a>
              <a href="#process" className="px-4 py-2 text-white/70 hover:text-amber-400">Approach</a>
              <a href="#testimonials" className="px-4 py-2 text-white/70 hover:text-amber-400">Testimonials</a>
              <a href="#contact" className="px-4 py-2 text-white/70 hover:text-amber-400">Contact</a>
              <Link href="/dashboard" className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-center font-medium rounded-lg mt-2">
                Client Portal
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Premium Corporate */}
      <section className="relative z-10 min-h-[85vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 rounded-full text-sm" style={{ background: 'rgba(212,175,55,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <Gem size={14} className="text-amber-400" />
                <span className="text-amber-300 tracking-wide">Trusted by Industry Leaders</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                <span className="bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
                  Excellence in
                </span>
                <br />
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                  Financial Advisory
                </span>
              </h1>

              <p className="text-lg md:text-xl text-white/60 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Strategic financial guidance and investment advisory services for discerning institutions and corporations. Where precision meets prosperity.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                <a href="#contact" className="group px-10 py-4 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-semibold rounded-lg shadow-xl flex items-center justify-center gap-3 hover:shadow-amber-500/40 transition-all tracking-wide">
                  Schedule Consultation
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="#services" className="px-10 py-4 flex items-center justify-center gap-3 rounded-lg text-amber-300 font-medium" style={{ background: 'rgba(212,175,55,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  Explore Services
                </a>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-8 mt-14 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {[
                    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=40&h=40&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=40&h=40&fit=crop&crop=face'
                  ].map((src, i) => (
                    <img key={i} src={src} alt="" className="w-11 h-11 rounded-full border-2 border-amber-500/30 object-cover" />
                  ))}
                </div>
                <div>
                  <p className="text-white font-semibold">150+ Fortune 500 Clients</p>
                  <p className="text-sm text-white/50">Trust our expertise</p>
                </div>
              </div>
            </div>

            {/* Hero Visual - Premium Dashboard */}
            <div className="relative hidden lg:block">
              <div className="relative z-10 p-8 rounded-2xl" style={{ background: 'rgba(20,20,40,0.8)', backdropFilter: 'blur(30px)', border: '1px solid rgba(212,175,55,0.15)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
                      <TrendingUp size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Portfolio Performance</h3>
                      <p className="text-sm text-white/50">YTD Returns</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm bg-emerald-500/20 text-emerald-400">+24.8%</span>
                </div>

                {/* Mini chart visualization */}
                <div className="flex items-end gap-2 h-32 mb-6">
                  {[40, 55, 45, 70, 60, 85, 75, 90, 80, 95, 88, 100].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i === 11 ? 'linear-gradient(180deg, #D4AF37, #B8860B)' : 'rgba(212,175,55,0.2)' }} />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-2xl font-bold text-white">₹2.5T</p>
                    <p className="text-xs text-white/50 mt-1">Assets Managed</p>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-2xl font-bold text-amber-400">98%</p>
                    <p className="text-xs text-white/50 mt-1">Success Rate</p>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-2xl font-bold text-white">24h</p>
                    <p className="text-xs text-white/50 mt-1">Response Time</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <CheckCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Compliance Verified</p>
                      <p className="text-xs text-white/50">All regulatory requirements met</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-5 -right-5 p-4 rounded-xl animate-bounce" style={{ background: 'rgba(20,20,40,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.2)', animationDuration: '4s' }}>
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-amber-400" />
                  <span className="text-sm text-white">Bank-Grade Security</span>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-5 p-4 rounded-xl animate-bounce" style={{ background: 'rgba(20,20,40,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.2)', animationDuration: '5s', animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-amber-400" />
                  <span className="text-sm text-white">ISO 27001 Certified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Premium Metrics */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-10 md:p-14 rounded-2xl" style={{ background: 'rgba(20,20,40,0.6)', backdropFilter: 'blur(30px)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)' }}>
                    {i === 0 && <TrendingUp size={32} className="text-amber-400" />}
                    {i === 1 && <Handshake size={32} className="text-amber-400" />}
                    {i === 2 && <Star size={32} className="text-amber-400" />}
                    {i === 3 && <Award size={32} className="text-amber-400" />}
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} prefix={stat.prefix || ''} />
                  </div>
                  <div className="text-sm text-white/50 tracking-wide uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative z-10 py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-5 py-2 mb-6 rounded-full text-sm" style={{ background: 'rgba(212,175,55,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Zap size={14} className="inline mr-2 text-amber-400" />
              Our Expertise
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-5">
              Comprehensive{' '}
              <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">Financial Solutions</span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Strategic advisory services designed for the unique needs of institutional and corporate clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, i) => (
              <div key={i} className="group p-8 rounded-2xl transition-all duration-500 hover:scale-[1.02]" style={{ background: 'rgba(20,20,40,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${service.color}15`, border: `1px solid ${service.color}30` }}>
                    <service.icon size={32} style={{ color: service.color }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3 tracking-wide">{service.title}</h3>
                    <p className="text-white/60 leading-relaxed">{service.description}</p>
                    <a href="#contact" className="inline-flex items-center gap-2 mt-5 text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium">
                      Learn More <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="relative z-10 py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-5 py-2 mb-6 rounded-full text-sm" style={{ background: 'rgba(212,175,55,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Clock size={14} className="inline mr-2 text-amber-400" />
              Our Approach
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-5">
              A Proven{' '}
              <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">Methodology</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, i) => (
              <div key={i} className="relative p-8 rounded-2xl text-center" style={{ background: 'rgba(20,20,40,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.08)' }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}>
                  {step.step}
                </div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(212,175,55,0.1)' }}>
                  <step.icon size={28} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 tracking-wide">{step.title}</h3>
                <p className="text-sm text-white/60">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-5 py-2 mb-6 rounded-full text-sm" style={{ background: 'rgba(212,175,55,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Heart size={14} className="inline mr-2 text-amber-400" />
              Client Testimonials
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-5">
              Trusted by{' '}
              <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">Industry Leaders</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="p-8 rounded-2xl" style={{ background: 'rgba(20,20,40,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <div className="flex items-center gap-4 mb-5">
                  <img src={testimonial.image} alt={testimonial.name} className="w-14 h-14 rounded-full object-cover border-2 border-amber-500/30" />
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-amber-400/80">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-white/70 italic leading-relaxed">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Premium */}
      <section id="contact" className="relative z-10 py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-14 md:p-20 rounded-3xl text-center overflow-hidden">
            <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(184,134,11,0.1))', filter: 'blur(60px)' }} />
            <div className="absolute inset-0 rounded-3xl border" style={{ borderColor: 'rgba(212,175,55,0.2)' }} />
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-500/30">
                <Crown size={40} className="text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
                Begin Your Partnership
              </h2>
              <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
                Schedule a confidential consultation with our senior advisory team to explore how we can accelerate your financial objectives.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <a href="mailto:partnerships@agassociates.in" className="group px-10 py-4 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-semibold rounded-lg shadow-xl flex items-center justify-center gap-3 hover:shadow-amber-500/40 transition-all tracking-wide">
                  Request Consultation
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="tel:+919699218421" className="px-10 py-4 rounded-lg text-amber-300 font-medium flex items-center justify-center gap-3" style={{ background: 'rgba(212,175,55,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  +91 96992 18421
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Premium */}
      <footer id="contact" className="relative z-10 mx-6 mb-6 p-10 rounded-2xl" style={{ background: 'rgba(15,15,30,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.1)' }}>
        <div className="grid md:grid-cols-4 gap-12 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-yellow-500 rounded-lg flex items-center justify-center">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-serif font-semibold tracking-wide">AG ASSOCIATES</h3>
                <span className="text-[9px] uppercase text-amber-400/70 tracking-widest">Premium Financial Advisory</span>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              India's premier financial advisory firm delivering strategic guidance for institutions and corporations.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 tracking-wide">Services</h4>
            <ul className="space-y-2.5 text-white/50 text-sm">
              <li><a href="#services" className="hover:text-amber-400 transition-colors">Corporate Advisory</a></li>
              <li><a href="#services" className="hover:text-amber-400 transition-colors">Portfolio Management</a></li>
              <li><a href="#services" className="hover:text-amber-400 transition-colors">Risk Mitigation</a></li>
              <li><a href="#services" className="hover:text-amber-400 transition-colors">Strategic Planning</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 tracking-wide">Company</h4>
            <ul className="space-y-2.5 text-white/50 text-sm">
              <li><a href="#" className="hover:text-amber-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Careers</a></li>
              <li><a href="#testimonials" className="hover:text-amber-400 transition-colors">Testimonials</a></li>
              <li><a href="#contact" className="hover:text-amber-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 tracking-wide">Contact</h4>
            <ul className="space-y-2.5 text-white/50 text-sm">
              <li>partnerships@agassociates.in</li>
              <li>+91 22 4567 8900</li>
              <li>One World Trade Center</li>
              <li>Bandra Kurla Complex</li>
              <li>Mumbai 400051</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">© 2024 AG Associates. All rights reserved. | SEBI Registered Investment Advisor</p>
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50">
        <ChevronDown size={20} className="transform rotate-180" />
      </button>
    </main>
  );
}
