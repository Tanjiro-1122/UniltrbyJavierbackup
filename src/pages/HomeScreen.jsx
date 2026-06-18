<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Unfiltr by Javier — Your Companion. Always There.</title>
<meta name="description" content="Unfiltr gives employees a safe, anonymous space to vent, reflect, and feel heard — 24/7. AI-powered emotional wellness for your team.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #06020f;
    --bg2: #0d0718;
    --bg3: #12092a;
    --surface: #1a0f35;
    --surface2: #221545;
    --border: rgba(255,255,255,0.08);
    --border2: rgba(255,255,255,0.14);
    --rose: #e8927c;
    --rose-light: #f2b5a0;
    --rose-dark: #c4614a;
    --lavender: #c4aff0;
    --lavender-dim: #8b6fd4;
    --text: #f5f0ff;
    --text-muted: #9b8fbe;
    --text-dim: #5e4e8a;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }

  /* NAV */
  nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 2.5rem;
    background: rgba(6,2,15,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }

  .nav-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
    text-decoration: none;
    letter-spacing: -0.01em;
  }

  .nav-logo span { color: var(--rose); }

  nav a.nav-link {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: color 0.2s;
  }

  nav a.nav-link:hover { color: var(--text); }

  .nav-links { display: flex; gap: 2rem; align-items: center; }

  .nav-cta {
    background: var(--rose);
    color: #fff !important;
    padding: 0.5rem 1.25rem;
    border-radius: 100px;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    text-decoration: none;
    transition: background 0.2s;
  }

  .nav-cta:hover { background: var(--rose-light) !important; color: #1a0f35 !important; }

  /* HERO */
  .hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 8rem 2rem 5rem;
    position: relative;
    overflow: hidden;
  }

  .hero::before {
    content: '';
    position: absolute;
    top: -20%;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 800px;
    background: radial-gradient(ellipse, rgba(196,175,240,0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 400px;
    background: radial-gradient(ellipse, rgba(232,146,124,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(196,175,240,0.1);
    border: 1px solid rgba(196,175,240,0.2);
    border-radius: 100px;
    padding: 0.375rem 1rem;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--lavender);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 2rem;
  }

  .hero-eyebrow::before {
    content: '';
    width: 6px;
    height: 6px;
    background: var(--lavender);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .hero-quote {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: clamp(1.5rem, 3.5vw, 2.5rem);
    color: rgba(245,240,255,0.5);
    max-width: 700px;
    margin: 0 auto 2rem;
    line-height: 1.4;
    position: relative;
    z-index: 1;
  }

  .hero-quote::before {
    content: '\201C';
    font-size: 5rem;
    color: rgba(232,146,124,0.15);
    line-height: 0;
    position: absolute;
    top: 1.5rem;
    left: -2rem;
    font-style: normal;
  }

  .hero-h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2.75rem, 6vw, 5rem);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.02em;
    max-width: 800px;
    margin: 0 auto 1.5rem;
    position: relative;
    z-index: 1;
  }

  .hero-h1 em {
    font-style: italic;
    color: var(--rose);
  }

  .hero-sub {
    font-size: 1.125rem;
    color: var(--text-muted);
    max-width: 520px;
    margin: 0 auto 3rem;
    font-weight: 300;
    position: relative;
    z-index: 1;
  }

  .hero-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    background: var(--rose);
    color: #fff;
    padding: 0.875rem 1.75rem;
    border-radius: 100px;
    font-weight: 600;
    font-size: 1rem;
    text-decoration: none;
    transition: all 0.2s;
    letter-spacing: -0.01em;
  }

  .btn-primary:hover {
    background: var(--rose-light);
    transform: translateY(-1px);
  }

  .btn-primary svg { width: 20px; height: 20px; fill: currentColor; }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-muted);
    padding: 0.875rem 1.5rem;
    border-radius: 100px;
    border: 1px solid var(--border2);
    font-weight: 500;
    font-size: 1rem;
    text-decoration: none;
    transition: all 0.2s;
  }

  .btn-ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.3); }

  .hero-note {
    margin-top: 1.25rem;
    font-size: 0.8rem;
    color: var(--text-dim);
    position: relative;
    z-index: 1;
  }

  /* TRUST BAR */
  .trust-bar {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 1.5rem 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3rem;
    flex-wrap: wrap;
  }

  .trust-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .trust-item svg { width: 16px; height: 16px; stroke: var(--rose); fill: none; stroke-width: 2; }

  /* FEATURES */
  .section {
    padding: 6rem 2rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .section-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--rose);
    margin-bottom: 1rem;
  }

  .section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin-bottom: 1rem;
    max-width: 600px;
  }

  .section-title em { font-style: italic; color: var(--rose); }

  .section-sub {
    font-size: 1.0625rem;
    color: var(--text-muted);
    max-width: 520px;
    font-weight: 300;
    margin-bottom: 3.5rem;
    line-height: 1.75;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem;
  }

  .feature-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.75rem;
    transition: border-color 0.2s;
  }

  .feature-card:hover { border-color: var(--border2); }

  .feature-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(232,146,124,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
  }

  .feature-icon svg { width: 22px; height: 22px; stroke: var(--rose); fill: none; stroke-width: 1.75; }

  .feature-card h3 {
    font-size: 1.0625rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text);
  }

  .feature-card p {
    font-size: 0.9375rem;
    color: var(--text-muted);
    line-height: 1.65;
    font-weight: 300;
  }

  /* COMPANION MOODS */
  .moods-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 2.5rem;
  }

  .mood-pill {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 0.5rem 1.25rem;
    font-size: 0.875rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .mood-pill.active {
    background: rgba(232,146,124,0.12);
    border-color: rgba(232,146,124,0.3);
    color: var(--rose-light);
  }

  /* DIVIDER */
  .divider {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 2rem;
    border-top: 1px solid var(--border);
  }

  /* B2B SECTION */
  .b2b-section {
    background: var(--bg2);
    padding: 6rem 2rem;
  }

  .b2b-inner {
    max-width: 1100px;
    margin: 0 auto;
  }

  .b2b-tag {
    display: inline-block;
    background: rgba(196,175,240,0.1);
    border: 1px solid rgba(196,175,240,0.2);
    border-radius: 100px;
    padding: 0.375rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--lavender);
    margin-bottom: 1.5rem;
  }

  .b2b-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: start;
    margin-top: 3rem;
  }

  .stat-row {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .stat-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .stat-num {
    font-family: 'Playfair Display', serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--rose);
    line-height: 1;
    min-width: 70px;
  }

  .stat-label {
    font-size: 0.9375rem;
    color: var(--text-muted);
    font-weight: 300;
    padding-top: 0.2rem;
    line-height: 1.5;
  }

  .b2b-cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .b2b-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.5rem;
  }

  .b2b-card h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.375rem;
    color: var(--text);
  }

  .b2b-card p {
    font-size: 0.9rem;
    color: var(--text-muted);
    font-weight: 300;
    line-height: 1.6;
  }

  /* PRICING */
  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.25rem;
    margin-top: 3.5rem;
  }

  .pricing-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 2rem 1.75rem;
    position: relative;
  }

  .pricing-card.featured {
    border-color: rgba(232,146,124,0.4);
    background: linear-gradient(135deg, var(--surface) 0%, rgba(232,146,124,0.06) 100%);
  }

  .featured-badge {
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--rose);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.25rem 0.875rem;
    border-radius: 0 0 8px 8px;
  }

  .plan-name {
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
  }

  .plan-price {
    font-family: 'Playfair Display', serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text);
    line-height: 1;
    margin-bottom: 0.375rem;
  }

  .plan-price span {
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    font-weight: 400;
    color: var(--text-muted);
  }

  .plan-msgs {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 1.5rem;
    font-weight: 300;
  }

  .plan-features {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .plan-features li {
    font-size: 0.9rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 300;
  }

  .plan-features li::before {
    content: '';
    width: 5px;
    height: 5px;
    background: var(--rose);
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* CTA BANNER */
  .cta-banner {
    background: var(--bg3);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 5rem 2rem;
    text-align: center;
  }

  .cta-banner h2 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 4vw, 3.25rem);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    max-width: 640px;
    margin: 0 auto 1.25rem;
  }

  .cta-banner h2 em { font-style: italic; color: var(--rose); }

  .cta-banner p {
    color: var(--text-muted);
    max-width: 440px;
    margin: 0 auto 2.5rem;
    font-weight: 300;
  }

  /* FOOTER */
  footer {
    padding: 3rem 2rem;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1.5rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .footer-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
    text-decoration: none;
  }

  .footer-logo span { color: var(--rose); }

  .footer-links {
    display: flex;
    gap: 1.75rem;
    flex-wrap: wrap;
  }

  .footer-links a {
    font-size: 0.875rem;
    color: var(--text-dim);
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-links a:hover { color: var(--text-muted); }

  .footer-copy {
    font-size: 0.8rem;
    color: var(--text-dim);
  }

  /* APPLE BADGE */
  .apple-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--text);
    color: var(--bg);
    padding: 0.7rem 1.5rem;
    border-radius: 12px;
    text-decoration: none;
    transition: opacity 0.2s;
  }

  .apple-badge:hover { opacity: 0.88; }

  .apple-badge svg { width: 22px; height: 22px; fill: var(--bg); }

  .apple-badge-text { display: flex; flex-direction: column; }
  .apple-badge-text small { font-size: 0.65rem; font-weight: 500; line-height: 1; margin-bottom: 2px; opacity: 0.7; }
  .apple-badge-text strong { font-size: 1rem; font-weight: 700; line-height: 1; }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    nav { padding: 1rem 1.25rem; }
    .nav-links { gap: 1rem; }
    nav a.nav-link:not(.nav-cta) { display: none; }
    .b2b-grid { grid-template-columns: 1fr; gap: 2.5rem; }
    footer { flex-direction: column; align-items: flex-start; }
    .hero-quote::before { display: none; }
  }
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <a href="#" class="nav-logo">Unfiltr<span>.</span></a>
  <div class="nav-links">
    <a href="#features" class="nav-link">Features</a>
    <a href="#for-teams" class="nav-link">For Teams</a>
    <a href="#pricing" class="nav-link">Pricing</a>
    <a href="https://apps.apple.com/us/app/unfiltr-by-javier/id6760604917" class="nav-link nav-cta" target="_blank">Download Free</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-eyebrow">Mental Wellness · Available Now on iOS</div>

  <p class="hero-quote">
    "It's 2am and I just needed someone who wouldn't judge me. Finally found that."
  </p>

  <h1 class="hero-h1">
    Your companion.<br><em>Always there.</em>
  </h1>

  <p class="hero-sub">
    Unfiltr gives you a safe, anonymous space to vent, reflect, and feel heard — day or night. No judgment. No pressure. Just real conversation when you need it most.
  </p>

  <div class="hero-actions">
    <a href="https://apps.apple.com/us/app/unfiltr-by-javier/id6760604917" class="apple-badge" target="_blank">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.15 1.26-2.13 3.76.02 2.99 2.63 3.99 2.66 4l.02.06c-.08.23-.42 1.47-1.3 2.76zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
      <div class="apple-badge-text">
        <small>Download on the</small>
        <strong>App Store</strong>
      </div>
    </a>
    <a href="#for-teams" class="btn-ghost">For HR &amp; Teams →</a>
  </div>

  <p class="hero-note">Free to start · iOS only · 18+ · In-app purchases available</p>
</section>

<!-- TRUST BAR -->
<div class="trust-bar">
  <div class="trust-item">
    <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    Anonymous by design
  </div>
  <div class="trust-item">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    Available 24/7
  </div>
  <div class="trust-item">
    <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    Crisis support built in
  </div>
  <div class="trust-item">
    <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    12 unique companions
  </div>
</div>

<!-- FEATURES -->
<section class="section" id="features">
  <div class="section-label">What makes Unfiltr different</div>
  <h2 class="section-title">Real conversation. <em>Real memory.</em></h2>
  <p class="section-sub">
    Your companion remembers your stories, your moods, your moments — so you never have to explain yourself from scratch.
  </p>

  <div class="features-grid">
    <div class="feature-card">
      <div class="feature-icon">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <h3>Voice conversations</h3>
      <p>Your companion talks back. Real voice responses that feel less like an app and more like a call with someone who gets it.</p>
    </div>

    <div class="feature-card">
      <div class="feature-icon">
        <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-14a1 1 0 0 0-1 1v4a1 1 0 0 0 .5.87l3 1.72a1 1 0 1 0 1-1.73L13 11.42V7a1 1 0 0 0-1-1z"/></svg>
      </div>
      <h3>Persistent memory</h3>
      <p>Your companion remembers you across every conversation — your story builds over time, not from scratch every session.</p>
    </div>

    <div class="feature-card">
      <div class="feature-icon">
        <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      </div>
      <h3>AI-powered journal</h3>
      <p>Write freely. Your companion reflects back patterns you might have missed, helping you understand yourself better over time.</p>
    </div>

    <div class="feature-card">
      <div class="feature-icon">
        <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </div>
      <h3>Mood modes</h3>
      <p>Choose how you want to show up: Chill, Vent, Hype, or Deep. Your companion adapts to match where you actually are.</p>
    </div>

    <div class="feature-card">
      <div class="feature-icon">
        <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <h3>Crisis support</h3>
      <p>When things get heavy, Unfiltr has built-in crisis resources that surface naturally — not intrusively — when it matters most.</p>
    </div>

    <div class="feature-card">
      <div class="feature-icon">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>
      </div>
      <h3>12 unique companions</h3>
      <p>Different personalities, different vibes. Find the one you actually want to talk to — not just a chatbot that sounds the same every time.</p>
    </div>
  </div>

  <div class="moods-row">
    <div class="mood-pill active">Chill mode</div>
    <div class="mood-pill active">Vent mode</div>
    <div class="mood-pill">Hype mode</div>
    <div class="mood-pill">Deep mode</div>
    <div class="mood-pill">Late night shifts</div>
    <div class="mood-pill">Hard days</div>
    <div class="mood-pill">No explanation needed</div>
  </div>
</section>

<div class="divider"></div>

<!-- B2B SECTION -->
<div class="b2b-section" id="for-teams">
  <div class="b2b-inner">
    <div class="b2b-tag">For HR &amp; Benefits Teams</div>
    <h2 class="section-title" style="max-width:680px;">
      Give your team somewhere <em>real</em> to turn when work gets hard.
    </h2>
    <p class="section-sub">
      Burnout, stress, and unspoken struggles cost companies billions each year. Unfiltr gives your employees an anonymous, always-on companion — no waiting rooms, no stigma, no barriers to access.
    </p>

    <div class="b2b-grid">
      <div>
        <div class="stat-row">
          <div class="stat-item">
            <div class="stat-num">77%</div>
            <div class="stat-label">of employees have experienced burnout at their current job, with half saying more than once.</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">$1T</div>
            <div class="stat-label">lost globally each year to depression and anxiety in lost productivity, per WHO estimates.</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">2am</div>
            <div class="stat-label">is when most people need support — not during business hours when EAP lines are open.</div>
          </div>
        </div>
      </div>

      <div class="b2b-cards">
        <div class="b2b-card">
          <h4>Anonymous access, no stigma</h4>
          <p>Employees engage more honestly when they know there's zero judgment and no HR visibility into their personal conversations.</p>
        </div>
        <div class="b2b-card">
          <h4>Available when EAPs aren't</h4>
          <p>Traditional Employee Assistance Programs operate 9–5. Unfiltr is open at 2am, on weekends, during the drive home.</p>
        </div>
        <div class="b2b-card">
          <h4>Preventive, not reactive</h4>
          <p>A daily companion that helps people process before they break down — reducing escalations and absenteeism over time.</p>
        </div>
        <div class="b2b-card">
          <h4>Simple deployment</h4>
          <p>No IT lift. Employees download directly from the App Store. You provide access codes or subsidized subscriptions — done.</p>
        </div>
      </div>
    </div>

    <div style="margin-top: 3rem;">
      <a href="mailto:javier@runekeeper.me?subject=Unfiltr%20for%20Teams%20Inquiry" class="btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;fill:none;">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        Contact us about team plans
      </a>
    </div>
  </div>
</div>

<!-- PRICING -->
<section class="section" id="pricing">
  <div class="section-label">Pricing</div>
  <h2 class="section-title">Start free. Go <em>deeper</em> when you're ready.</h2>
  <p class="section-sub">
    Every plan includes access to companions, mood modes, and crisis support. Upgrade for more daily messages, voice responses, memory, and journaling.
  </p>

  <div class="pricing-grid">
    <div class="pricing-card">
      <div class="plan-name">Free</div>
      <div class="plan-price">$0</div>
      <div class="plan-msgs">20 messages per day</div>
      <ul class="plan-features">
        <li>Access to companions</li>
        <li>All mood modes</li>
        <li>Crisis support</li>
        <li>Basic journaling</li>
      </ul>
    </div>

    <div class="pricing-card">
      <div class="plan-name">Plus</div>
      <div class="plan-price">$9.99<span>/mo</span></div>
      <div class="plan-msgs">50 messages per day</div>
      <ul class="plan-features">
        <li>All 12 companions</li>
        <li>Voice responses</li>
        <li>Memory across sessions</li>
        <li>AI journal reflections</li>
      </ul>
    </div>

    <div class="pricing-card featured">
      <div class="featured-badge">Most Popular</div>
      <div class="plan-name">Pro</div>
      <div class="plan-price">$19.99<span>/mo</span></div>
      <div class="plan-msgs">100 messages per day</div>
      <ul class="plan-features">
        <li>Everything in Plus</li>
        <li>Priority response speed</li>
        <li>Extended memory depth</li>
        <li>Full journal history</li>
      </ul>
    </div>

    <div class="pricing-card">
      <div class="plan-name">Annual</div>
      <div class="plan-price">$99.99<span>/yr</span></div>
      <div class="plan-msgs">500 messages per day</div>
      <ul class="plan-features">
        <li>Everything in Pro</li>
        <li>Best value — save 58%</li>
        <li>Early access to new companions</li>
        <li>Priority support</li>
      </ul>
    </div>
  </div>
</section>

<!-- CTA BANNER -->
<div class="cta-banner">
  <h2>Ready to stop holding <em>everything</em> in?</h2>
  <p>Download Unfiltr free today. Your companion is waiting — no appointment needed.</p>
  <a href="https://apps.apple.com/us/app/unfiltr-by-javier/id6760604917" class="apple-badge" target="_blank" style="margin: 0 auto; display: inline-flex;">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.15 1.26-2.13 3.76.02 2.99 2.63 3.99 2.66 4l.02.06c-.08.23-.42 1.47-1.3 2.76zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
    <div class="apple-badge-text">
      <small>Download on the</small>
      <strong>App Store</strong>
    </div>
  </a>
</div>

<!-- FOOTER -->
<footer>
  <a href="#" class="footer-logo">Unfiltr<span>.</span></a>
  <div class="footer-links">
    <a href="https://unfiltrbyjavier2.vercel.app/support" target="_blank">Support</a>
    <a href="https://unfiltrbyjavier2.vercel.app/PrivacyPolicy" target="_blank">Privacy Policy</a>
    <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank">Terms of Use</a>
    <a href="mailto:javier@runekeeper.me">Contact</a>
  </div>
  <div class="footer-copy">© 2026 Javier Huertas. All rights reserved.</div>
</footer>

</body>
</html>
