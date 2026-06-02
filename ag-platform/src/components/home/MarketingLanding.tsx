import { useState } from 'react';
import { ArrowRight, Calculator, ShieldCheck, Home, CheckCircle2, ChevronRight, X, Building, RotateCcw, Landmark, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MarketingLanding() {
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [tenure, setTenure] = useState(20);
  const interestRate = 8.5;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const monthlyRate = interestRate / 12 / 100;
  const emi = Math.round(
    loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure * 12) /
    (Math.pow(1 + monthlyRate, tenure * 12) - 1)
  );

  return (
    <div className="flex flex-col relative">
      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-32 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Background glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col items-start gap-6 relative z-10">
          <div className="glass-badge inline-flex">
            <Home size={14} /> Home Loan Advisory
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-[1.1]">
            Your Home Loan,<br /> 
            <span className="text-gradient">Structured with Precision.</span>
          </h1>
          <p className="text-lg text-white/70 leading-relaxed max-w-md">
            AG Associates navigates the Indian home loan ecosystem so you don't have to. We connect you with India's top lenders under optimal RBI guidelines.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="glass-button glass-button-primary mt-2"
          >
            Prequalify in 2 Minutes <ArrowRight size={18} />
          </button>
        </div>
        
        {/* EMI Calculator with Glass */}
        <div className="glass-card-elevated p-8 relative">
          <div className="relative z-10">
            <h3 className="text-xl font-serif font-semibold text-white mb-6 flex items-center gap-2">
              <Calculator size={20} className="text-violet-400" /> EMI Estimator
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-medium text-white/70 mb-2">
                  <span>Loan Amount</span>
                  <span className="font-mono text-violet-300">₹{loanAmount.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range" 
                  min="1000000" max="50000000" step="100000"
                  value={loanAmount} 
                  onChange={e => setLoanAmount(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm font-medium text-white/70 mb-2">
                  <span>Tenure (Years)</span>
                  <span className="font-mono text-violet-300">{tenure} Yrs</span>
                </div>
                <input 
                  type="range" 
                  min="5" max="30" step="1"
                  value={tenure} 
                  onChange={e => setTenure(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
                />
              </div>
              
              <div className="glass-card p-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/70">Indicative EMI</span>
                  <span className="text-2xl font-mono font-bold text-white">
                    ₹{emi.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <p className="text-xs text-white/40 text-center">
                *Calculated at {interestRate}% indicative interest rate. Subject to lender approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Taxonomy */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-white mb-4">Advisory Services</h2>
            <p className="text-white/60 max-w-2xl mx-auto">We structure financing across the full spectrum of residential real estate assets.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Home />, title: 'Fresh Home Loan', desc: 'Secure optimal rates for new purchases and under-construction properties.' },
              { icon: <RotateCcw />, title: 'Balance Transfer', desc: 'Refinance your existing loan to a lower rate, reducing EMI and tenure.' },
              { icon: <Landmark />, title: 'Plot Loan', desc: 'Finance land acquisition for self-construction within municipal limits.' },
              { icon: <Building />, title: 'Construction Loan', desc: 'Structured disbursements aligned with construction milestones.' },
              { icon: <Plane />, title: 'NRI Home Loan', desc: 'End-to-end processing for non-resident Indians acquiring property.' },
              { icon: <Calculator />, title: 'Top-Up Loan', desc: 'Leverage equity in your existing property for personal or renovation needs.' },
            ].map((service, idx) => (
              <div key={idx} className="glass-card p-6 cursor-pointer group">
                <div className="text-violet-400 bg-violet-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
                  {service.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{service.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reg Section */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto w-full text-center relative z-10">
          <div className="glass-card-elevated p-12 inline-block w-full">
            <ShieldCheck size={48} className="text-violet-400 mx-auto mb-6" />
            <h2 className="text-3xl font-serif font-bold text-white mb-4">Regulatory Integrity</h2>
            <p className="text-white/60 max-w-2xl mx-auto mb-8">
              We operate in strict adherence to the RBI Fair Practices Code. No hidden fees. Complete transparency on lender terms, conditions, and processing structures.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-white/70">
              <a href="#" className="hover:text-white transition-all duration-300">Fair Practices Code</a>
              <span className="text-white/20">•</span>
              <a href="#" className="hover:text-white transition-all duration-300">MITC Templates</a>
              <span className="text-white/20">•</span>
              <a href="#" className="hover:text-white transition-all duration-300">Grievance Redressal</a>
              <span className="text-white/20">•</span>
              <a href="#" className="hover:text-white transition-all duration-300">Fee Structure</a>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && <LeadCaptureModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

function LeadCaptureModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  return (
    <div className="glass-modal-overlay">
      <div className="glass-modal">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="bg-violet-500/20 text-violet-300 w-6 h-6 rounded-lg flex items-center justify-center font-mono border border-violet-500/30">
              {step}
            </span>
            <span className="text-white/70">of 3</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-all duration-300 hover:rotate-90">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-serif font-bold text-white">Let's start with the basics.</h3>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Full Name (As per PAN)</label>
                <input type="text" className="glass-input w-full" placeholder="e.g. Rahul Sharma" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Mobile Number</label>
                <div className="flex">
                  <span className="glass-input border-r-0 rounded-r-none font-mono text-white/50">+91</span>
                  <input type="tel" className="glass-input flex-1 rounded-l-none font-mono" placeholder="90000 00000" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-serif font-bold text-white">Employment & Income</h3>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Employment Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="glass-button justify-center">Salaried</button>
                  <button className="glass-button justify-center">Self-Employed</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Monthly In-Hand Income</label>
                <div className="flex relative">
                  <span className="absolute left-3 top-2.5 text-white/50 font-mono">₹</span>
                  <input type="text" className="glass-input w-full pl-8" placeholder="100000" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">You're Pre-Qualified</h3>
              <p className="text-white/60">We've generated an indicative offer based on soft bureau pulls. Your advisor will connect via WhatsApp shortly.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end">
          {step < 3 ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="glass-button glass-button-primary w-full justify-center"
            >
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={() => {
                onClose();
                navigate('/applicant');
              }}
              className="glass-button glass-button-primary w-full justify-center"
            >
              Go to Applicant Portal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
