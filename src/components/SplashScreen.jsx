import { useEffect, useState } from 'react';

const SPLASH_IMAGE = 'https://media.base44.com/images/public/69b332a392004d139d4ba495/d653bb16a_generated_image.png';

export default function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(false), 2200); // start fade out
    const t2 = setTimeout(() => onComplete?.(), 2800);    // done
    return () => [t1, t2].forEach(clearTimeout);
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
      transition: 'opacity 0.6s ease-in-out',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'all' : 'none',
    }}>
      <img
        src={SPLASH_IMAGE}
        alt="Unfiltr"
        style={{
          width: '260px',
          height: '260px',
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 40px rgba(168,85,247,0.7)) drop-shadow(0 0 80px rgba(109,40,217,0.4))',
        }}
      />
    </div>
  );
}
