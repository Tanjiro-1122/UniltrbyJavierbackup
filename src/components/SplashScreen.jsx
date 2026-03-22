import { useEffect, useState } from 'react';

const SPLASH_IMAGE = 'https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/d653bb16a_generated_image.png';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('enter'); // enter → hold → pulse → exit

  useEffect(() => {
    // Phase timeline
    const t1 = setTimeout(() => setPhase('hold'),  600);   // fade in done
    const t2 = setTimeout(() => setPhase('pulse'), 1400);  // start pulse
    const t3 = setTimeout(() => setPhase('exit'),  2400);  // start fade out
    const t4 = setTimeout(() => onComplete?.(),    3000);  // done

    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: '#06020f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: phase === 'exit' ? 'opacity 0.6s ease-in-out' : 'opacity 0.6s ease-in-out',
      opacity: phase === 'exit' ? 0 : 1,
    }}>

      {/* Ambient glow orb behind everything */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(109,40,217,0.08) 40%, transparent 70%)',
        animation: 'ambientPulse 2s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Rotating outer ring */}
      <div style={{
        position: 'absolute',
        width: '340px',
        height: '340px',
        borderRadius: '50%',
        border: '1px solid rgba(168,85,247,0.15)',
        animation: 'slowSpin 8s linear infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        border: '1px solid rgba(168,85,247,0.08)',
        animation: 'slowSpinReverse 12s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Main splash image */}
      <div style={{
        position: 'relative',
        width: '320px',
        height: '320px',
        animation: phase === 'pulse'
          ? 'triquetraPulse 0.9s ease-in-out infinite alternate'
          : phase === 'enter'
          ? 'triquetralFadeIn 0.6s ease-out forwards'
          : 'none',
        filter: phase === 'pulse'
          ? 'drop-shadow(0 0 40px rgba(168,85,247,0.9)) drop-shadow(0 0 80px rgba(109,40,217,0.6)) brightness(1.15)'
          : 'drop-shadow(0 0 24px rgba(168,85,247,0.6)) drop-shadow(0 0 48px rgba(109,40,217,0.3))',
        transition: 'filter 0.4s ease',
      }}>
        <img
          src={SPLASH_IMAGE}
          alt="Unfiltr"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: '24px',
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${2 + Math.random() * 3}px`,
          height: `${2 + Math.random() * 3}px`,
          borderRadius: '50%',
          background: `rgba(${168 + Math.floor(Math.random()*40)}, ${85 + Math.floor(Math.random()*40)}, 247, ${0.4 + Math.random()*0.6})`,
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`,
          animation: `floatParticle ${2 + Math.random() * 3}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 2}s`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* CSS keyframes injected inline */}
      <style>{`
        @keyframes ambientPulse {
          0%   { transform: scale(1);    opacity: 0.6; }
          50%  { transform: scale(1.15); opacity: 1;   }
          100% { transform: scale(1);    opacity: 0.6; }
        }
        @keyframes slowSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes slowSpinReverse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes triquetraPulse {
          0%   { transform: scale(1);    filter: drop-shadow(0 0 30px rgba(168,85,247,0.7)) drop-shadow(0 0 60px rgba(109,40,217,0.4)) brightness(1.05); }
          100% { transform: scale(1.06); filter: drop-shadow(0 0 60px rgba(168,85,247,1.0)) drop-shadow(0 0 120px rgba(109,40,217,0.8)) brightness(1.25); }
        }
        @keyframes triquetralFadeIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes floatParticle {
          0%   { transform: translateY(0px)   scale(1);    opacity: 0; }
          30%  { opacity: 1; }
          70%  { opacity: 0.8; }
          100% { transform: translateY(-60px) scale(0.5);  opacity: 0; }
        }
      `}</style>
    </div>
  );
}
