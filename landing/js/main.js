/**
 * AG Associates Landing Page - Main JavaScript
 * Handles case tracker functionality, scroll animations, and interactive elements
 * Designed for 10/10 craft per top-design principles
 */

(function() {
  'use strict';

  // Mock case data for demo purposes
  const mockCases = {
    'NOI-2026-8901': {
      caseRef: 'NOI-2026-8901',
      loanAccount: 'LA-2026-HDFC-08901',
      bankName: 'HDFC Bank Ltd.',
      borrowerName: 'Rajesh & Priya Sharma',
      propertyAddress: 'Flat 1203, Tower B, Runwal Gardens, Majiwada, Thane West - 400601',
      loanAmount: '₹85,00,000',
      noiStatus: 'ACKNOWLEDGED',
      noiFiledDate: '2026-07-15',
      noiAckDate: '2026-07-16',
      sroOffice: 'Thane West (Majiwada) - SRO III',
      grasChallan: 'GRN-MH008920194',
      stampDutyPaid: '₹25,500 (0.3%)',
      lastUpdated: '2026-07-16 14:32 IST',
      timeline: [
        { date: '2026-07-14', status: 'Sanction Letter Received', details: 'Loan sanction letter received from HDFC Bank', icon: '📥' },
        { date: '2026-07-15', status: 'GRAS Challan Generated', details: 'Stamp duty challan paid via GRAS portal', icon: '💳' },
        { date: '2026-07-15', status: 'NOI Filed on IGR Portal', details: 'Section 89B Notice of Intimation e-filed', icon: '🏛️' },
        { date: '2026-07-16', status: 'ACKNOWLEDGED by Sub-Registrar', details: 'Filing acknowledged - Compliance Complete', icon: '✅' }
      ]
    },
    'NOI-2026-4412': {
      caseRef: 'NOI-2026-4412',
      loanAccount: 'LA-2026-SBI-04412',
      bankName: 'State Bank of India',
      borrowerName: 'Amit Kumar Singh',
      propertyAddress: 'Row House 45, Hillspring, Panchpakhadi, Thane West - 400602',
      loanAmount: '₹1,25,00,000',
      noiStatus: 'PENDING_ACKNOWLEDGMENT',
      noiFiledDate: '2026-07-28',
      noiAckDate: null,
      sroOffice: 'Thane West (Panchpakhadi) - SRO I',
      grasChallan: 'GRN-MH009156723',
      stampDutyPaid: '₹37,500 (0.3%)',
      lastUpdated: '2026-07-28 11:45 IST',
      timeline: [
        { date: '2026-07-25', status: 'Sanction Letter Received', details: 'Loan sanction letter received from SBI', icon: '📥' },
        { date: '2026-07-27', status: 'GRAS Challan Generated', details: 'Stamp duty challan paid via GRAS portal', icon: '💳' },
        { date: '2026-07-28', status: 'NOI Filed on IGR Portal', details: 'Section 89B Notice of Intimation e-filed', icon: '🏛️' },
        { date: '2026-07-28', status: 'Pending Sub-Registrar Acknowledgment', details: 'Awaiting acknowledgment from SRO', icon: '⏳' }
      ]
    }
  };

  // Status badge configurations
  const statusConfig = {
    'ACKNOWLEDGED': { label: 'ACKNOWLEDGED', class: 'status-acknowledged', icon: '✅' },
    'PENDING_ACKNOWLEDGMENT': { label: 'PENDING ACKNOWLEDGMENT', class: 'status-pending', icon: '⏳' },
    'FILED': { label: 'FILED', class: 'status-filed', icon: '📤' },
    'REJECTED': { label: 'REJECTED', class: 'status-rejected', icon: '❌' },
    'DRAFT': { label: 'DRAFT', class: 'status-draft', icon: '📝' }
  };

  // DOM Elements
  let trackInput, trackBtn, resultCard, header;

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    trackInput = document.getElementById('track-input');
    trackBtn = document.getElementById('track-btn');
    resultCard = document.getElementById('result-card');
    header = document.getElementById('header');

    if (trackBtn) {
      trackBtn.addEventListener('click', handleTrackClick);
    }

    if (trackInput) {
      trackInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          handleTrackClick();
        }
      });
    }

    // Sample query buttons (delegated)
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('tracker-sample')) {
        const value = e.target.dataset.value;
        if (trackInput && value) {
          trackInput.value = value;
          trackInput.focus();
        }
      }
    });

    // Initialize smooth scroll for anchor links
    initSmoothScroll();

    // Initialize intersection observer for scroll animations
    initScrollAnimations();

    // Initialize header scroll effect
    initHeaderScroll();

    // Initialize form handling
    initFormHandling();
  });

  function handleTrackClick() {
    const query = trackInput.value.trim().toUpperCase();

    if (!query) {
      showError('Please enter a Case Reference or Loan Account Number');
      return;
    }

    // Show loading state
    trackBtn.disabled = true;
    trackBtn.innerHTML = '<span>Tracking...</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"></path></svg>';
    resultCard.classList.remove('active');
    resultCard.innerHTML = '<div class="loading">Querying IGR & GRAS portals...</div>';

    // Simulate API call with timeout
    setTimeout(function() {
      const caseData = mockCases[query];

      trackBtn.disabled = false;
      trackBtn.innerHTML = '<span>Track</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';

      if (caseData) {
        renderCaseResult(caseData);
      } else {
        showError('No case found for reference: ' + query + '. Please check the Case Reference or Loan Account Number.');
      }
    }, 1200);
  }

  function renderCaseResult(data) {
    const config = statusConfig[data.noiStatus] || statusConfig['DRAFT'];

    const html = `
      <div class="result-header">
        <div class="result-case-ref">
          <span class="result-label">Case Reference</span>
          <span class="result-value">${escapeHtml(data.caseRef)}</span>
        </div>
        <div class="result-status ${config.class}">
          <span class="status-icon">${config.icon}</span>
          <span class="status-text">${config.label}</span>
        </div>
      </div>

      <div class="result-grid">
        <div class="result-field">
          <span class="result-label">Loan Account</span>
          <span class="result-value">${escapeHtml(data.loanAccount)}</span>
        </div>
        <div class="result-field">
          <span class="result-label">Bank / Institution</span>
          <span class="result-value">${escapeHtml(data.bankName)}</span>
        </div>
        <div class="result-field">
          <span class="result-label">Borrower</span>
          <span class="result-value">${escapeHtml(data.borrowerName)}</span>
        </div>
        <div class="result-field">
          <span class="result-label">Loan Amount</span>
          <span class="result-value gold-gradient-text">${escapeHtml(data.loanAmount)}</span>
        </div>
        <div class="result-field full-width">
          <span class="result-label">Property Address</span>
          <span class="result-value">${escapeHtml(data.propertyAddress)}</span>
        </div>
        <div class="result-field">
          <span class="result-label">SRO Office</span>
          <span class="result-value">${escapeHtml(data.sroOffice)}</span>
        </div>
        <div class="result-field">
          <span class="result-label">GRAS Challan (GRN)</span>
          <span class="result-value">${escapeHtml(data.grasChallan)}</span>
        </div>
        <div class="result-field">
          <span class="result-label">Stamp Duty Paid</span>
          <span class="result-value">${escapeHtml(data.stampDutyPaid)}</span>
        </div>
        <div class="result-field">
          <span class="result-label">NOI Filed Date</span>
          <span class="result-value">${formatDate(data.noiFiledDate)}</span>
        </div>
        <div class="result-field">
          <span class="result-label">Acknowledgment Date</span>
          <span class="result-value">${data.noiAckDate ? formatDate(data.noiAckDate) : '<span style="color: var(--gold-primary);">Pending</span>'}</span>
        </div>
        <div class="result-field full-width">
          <span class="result-label">Last Updated</span>
          <span class="result-value">${escapeHtml(data.lastUpdated)}</span>
        </div>
      </div>

      ${data.timeline ? renderTimeline(data.timeline) : ''}
    `;

    resultCard.innerHTML = html;
    resultCard.classList.add('active');

    // Scroll to result
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderTimeline(timeline) {
    const items = timeline.map(function(item, index) {
      return `
        <div class="timeline-item" style="animation-delay: ${index * 100}ms">
          <div class="timeline-marker">${item.icon}</div>
          <div class="timeline-content">
            <div class="timeline-date">${formatDate(item.date)}</div>
            <div class="timeline-status">${escapeHtml(item.status)}</div>
            <div class="timeline-details">${escapeHtml(item.details)}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="result-timeline">
        <div class="timeline-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          <span>Filing Timeline</span>
        </div>
        <div class="timeline-track">
          ${items}
        </div>
      </div>
    `;
  }

  function showError(message) {
    resultCard.innerHTML = `
      <div class="result-error">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
    resultCard.classList.add('active');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const headerHeight = header ? header.offsetHeight : 80;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  function initHeaderScroll() {
    if (!header) return;

    let lastScroll = 0;
    const threshold = 50;

    window.addEventListener('scroll', function() {
      const currentScroll = window.pageYOffset;

      if (currentScroll > threshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    }, { passive: true });
  }

  function initScrollAnimations() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.animate-reveal, .animate-reveal-left, .animate-reveal-right, .animate-scale-in').forEach(function(el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'none';
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements with animation classes
    const animationClasses = [
      '.animate-reveal',
      '.animate-reveal-left',
      '.animate-reveal-right',
      '.animate-scale-in'
    ];

    animationClasses.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(el) {
        el.style.opacity = '0';
        if (selector.includes('left')) {
          el.style.transform = 'translateX(-40px)';
        } else if (selector.includes('right')) {
          el.style.transform = 'translateX(40px)';
        } else if (selector.includes('scale')) {
          el.style.transform = 'scale(0.9)';
        } else {
          el.style.transform = 'translateY(30px)';
        }
        el.style.transition = 'opacity 0.8s var(--ease-expo-out), transform 0.8s var(--ease-expo-out)';
        observer.observe(el);
      });
    });
  }

  function initFormHandling() {
    const form = document.getElementById('empanelment-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      // Collect form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      // Simulate form submission
      setTimeout(function() {
        // Reset form
        form.reset();

        // Show success message
        submitBtn.textContent = 'Request Submitted ✓';
        submitBtn.style.background = 'var(--emerald-gradient)';
        submitBtn.style.borderColor = 'transparent';

        setTimeout(function() {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.style.borderColor = '';
        }, 3000);

        // In production, send to backend:
        // fetch('/api/empanelment', { method: 'POST', body: JSON.stringify(data) })
      }, 1500);
    });
  }

  // Add dynamic styles for JS-generated content
  function injectDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Result Card Styles */
      .result-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-5);
        padding-bottom: var(--space-4);
        border-bottom: 1px solid var(--border-glass);
        flex-wrap: wrap;
        gap: var(--space-3);
      }

      .result-case-ref .result-label {
        display: block;
        font-family: var(--font-display);
        font-size: var(--text-xs);
        color: var(--text-dim);
        text-transform: uppercase;
        letter-spacing: var(--tracking-wider);
        margin-bottom: var(--space-1);
      }

      .result-case-ref .result-value {
        font-family: var(--font-mono);
        font-size: var(--text-lg);
        font-weight: 700;
        color: var(--gold-primary);
      }

      .result-status {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-full);
        font-family: var(--font-display);
        font-size: var(--text-xs);
        font-weight: 700;
        letter-spacing: var(--tracking-wider);
        text-transform: uppercase;
      }

      .status-acknowledged {
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.3);
        color: var(--emerald-light);
      }

      .status-pending {
        background: rgba(234, 179, 8, 0.15);
        border: 1px solid rgba(234, 179, 8, 0.3);
        color: var(--gold-light);
      }

      .status-filed {
        background: rgba(14, 165, 233, 0.15);
        border: 1px solid rgba(14, 165, 233, 0.3);
        color: #38BDF8;
      }

      .status-rejected {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #F87171;
      }

      .status-draft {
        background: rgba(100, 116, 139, 0.15);
        border: 1px solid rgba(100, 116, 139, 0.3);
        color: var(--text-muted);
      }

      .result-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-4);
      }

      .result-field {
        padding: var(--space-3);
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-md);
      }

      .result-field.full-width {
        grid-column: 1 / -1;
      }

      .result-field .result-label {
        display: block;
        font-family: var(--font-display);
        font-size: var(--text-xs);
        color: var(--text-dim);
        text-transform: uppercase;
        letter-spacing: var(--tracking-wider);
        margin-bottom: var(--space-1);
      }

      .result-field .result-value {
        font-family: var(--font-editorial);
        font-style: italic;
        font-size: var(--text-sm);
        color: var(--text-primary);
        word-break: break-word;
      }

      .result-field .result-value.gold-gradient-text {
        font-family: var(--font-display);
        font-style: normal;
        font-weight: 700;
      }

      /* Timeline Styles */
      .result-timeline {
        margin-top: var(--space-6);
        padding-top: var(--space-5);
        border-top: 1px solid var(--border-glass);
      }

      .timeline-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-family: var(--font-display);
        font-size: var(--text-xs);
        font-weight: 700;
        color: var(--gold-primary);
        margin-bottom: var(--space-4);
        text-transform: uppercase;
        letter-spacing: var(--tracking-wider);
      }

      .timeline-track {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .timeline-item {
        display: flex;
        gap: var(--space-3);
        padding: var(--space-3);
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-md);
        animation: fade-in-up 0.4s var(--ease-expo-out) forwards;
        opacity: 0;
        transform: translateX(-10px);
      }

      .timeline-marker {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--bg-glass);
        border: 1px solid var(--border-glass);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--text-base);
        flex-shrink: 0;
      }

      .timeline-content {
        flex: 1;
        min-width: 0;
      }

      .timeline-date {
        font-family: var(--font-display);
        font-size: var(--text-xs);
        color: var(--text-dim);
        margin-bottom: var(--space-1);
      }

      .timeline-status {
        font-family: var(--font-display);
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .timeline-details {
        font-family: var(--font-editorial);
        font-style: italic;
        font-size: var(--text-xs);
        color: var(--text-muted);
      }

      /* Loading & Error States */
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-6);
        color: var(--text-muted);
        font-size: var(--text-sm);
      }

      .loading::before {
        content: '';
        width: 20px;
        height: 20px;
        border: 2px solid var(--border-glass);
        border-top-color: var(--gold-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      .result-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-6);
        text-align: center;
        color: var(--gold-light);
      }

      .result-error p {
        margin: 0;
        font-size: var(--text-sm);
      }

      /* Pipeline Demo Styles */
      .pipeline-demo {
        background: rgba(9, 13, 22, 0.8);
        border: 1px solid var(--border-glass);
        border-radius: 12px;
        padding: var(--space-5);
        text-align: left;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        line-height: var(--leading-loose);
        color: var(--emerald-accent);
      }

      /* Tracker Hint Styles */
      .tracker-hint {
        font-family: var(--font-editorial);
        font-style: italic;
        font-size: var(--text-xs);
        color: var(--text-dim);
        margin-bottom: var(--space-4);
      }

      .tracker-sample {
        font-family: var(--font-mono);
        color: var(--gold-primary);
        cursor: pointer;
        transition: color var(--transition-fast);
        padding: 0 var(--space-1);
      }

      .tracker-sample:hover {
        color: var(--gold-light);
      }

      /* Responsive adjustments for result card */
      @media (max-width: 640px) {
        .result-grid {
          grid-template-columns: 1fr;
        }

        .result-header {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Inject styles on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectDynamicStyles);
  } else {
    injectDynamicStyles();
  }

})();