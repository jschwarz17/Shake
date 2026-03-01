import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';

const POSES = [
  { bodyY: 0,  leftArm: -15, rightArm: 15,  leftLeg: 5,   rightLeg: -5  },
  { bodyY: 4,  leftArm: -60, rightArm: 40,  leftLeg: 20,  rightLeg: -15 },
  { bodyY: 6,  leftArm: 30,  rightArm: -30, leftLeg: -10, rightLeg: 10  },
  { bodyY: 2,  leftArm: 45,  rightArm: -65, leftLeg: -18, rightLeg: 22  },
];

const BOW_POSE = { bodyY: 8, leftArm: 50, rightArm: -50, leftLeg: 0, rightLeg: 0 };

export const DancingFigure: React.FC = () => {
  const bpm = useMIDIStore((s) => s.bpm);
  const currentStep = useMIDIStore((s) => s.currentStep);
  const events = useMIDIStore((s) => s.events);
  const isPlaying = useMIDIStore((s) => s.isPlaying);

  const [poseIndex, setPoseIndex] = React.useState(0);
  const [hitEffect, setHitEffect] = React.useState<'none' | 'kick' | 'snare'>('none');
  const [spinning, setSpinning] = React.useState(false);
  const [bowing, setBowing] = React.useState(false);
  const [frozen, setFrozen] = React.useState(false);
  const animRef = React.useRef<number>();
  const barCountRef = React.useRef(0);
  const prevStepRef = React.useRef(-1);

  const dancing = isPlaying && !frozen;

  // Track bar completions via currentStep wrapping from 15 → 0
  React.useEffect(() => {
    if (!dancing) {
      prevStepRef.current = -1;
      barCountRef.current = 0;
      setSpinning(false);
      setBowing(false);
      return;
    }

    const prev = prevStepRef.current;
    prevStepRef.current = currentStep;

    if (prev > currentStep && prev >= 12) {
      barCountRef.current++;
      const bars = barCountRef.current;

      if (bars % 8 === 0) {
        // Bow every 8 bars (128 steps)
        setBowing(true);
        const bowMs = (60 / bpm) * 2000;
        setTimeout(() => setBowing(false), bowMs);
      } else if (bars % 4 === 0) {
        // Spin every 4 bars (64 steps)
        setSpinning(true);
        const spinMs = (60 / bpm) * 1000;
        setTimeout(() => setSpinning(false), spinMs);
      }
    }
  }, [currentStep, dancing, bpm]);

  // Pose cycling based on BPM
  React.useEffect(() => {
    if (!dancing) {
      setPoseIndex(0);
      return;
    }

    const halfBeatMs = (60 / bpm) * 500;
    let lastTime = performance.now();
    let acc = 0;
    let pose = 0;

    const tick = (now: number) => {
      acc += now - lastTime;
      lastTime = now;
      if (acc >= halfBeatMs) {
        acc -= halfBeatMs;
        pose = (pose + 1) % POSES.length;
        setPoseIndex(pose);
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [dancing, bpm]);

  // Kick/snare hit detection
  React.useEffect(() => {
    if (!dancing) return;
    const hasKick = events.some((e) => e.trackId === 0 && e.step === currentStep);
    const hasSnare = events.some((e) => e.trackId === 2 && e.step === currentStep);
    if (hasKick) setHitEffect('kick');
    else if (hasSnare) setHitEffect('snare');

    const timer = setTimeout(() => setHitEffect('none'), 120);
    return () => clearTimeout(timer);
  }, [currentStep, dancing, events]);

  const activePose = bowing ? BOW_POSE : POSES[poseIndex];
  const transMs = (60 / bpm) * 380;
  const spinMs = (60 / bpm) * 1000;

  const hitTransform =
    hitEffect === 'kick'
      ? 'scaleY(0.86) translateY(3px)'
      : hitEffect === 'snare'
        ? 'scaleY(1.1) translateY(-2px)'
        : '';

  const spinTransform = spinning ? 'rotateY(360deg)' : 'rotateY(0deg)';

  const bowAngle = bowing ? 35 : 0;

  const limbStyle = (origin: string, angle: number): React.CSSProperties => ({
    transformOrigin: origin,
    transformBox: 'view-box' as React.CSSProperties['transformBox'],
    transform: `rotate(${dancing ? angle : 0}deg)`,
    transition: `transform ${transMs}ms ease-in-out`,
  });

  const stroke = frozen ? 'rgba(180,210,255,0.35)' : 'rgba(180,210,255,0.85)';
  const strokeDim = frozen ? 'rgba(180,210,255,0.25)' : 'rgba(180,210,255,0.7)';
  const jointFill = frozen ? 'rgba(180,210,255,0.2)' : 'rgba(180,210,255,0.5)';

  return (
    <div
      className="flex items-center justify-center cursor-pointer select-none"
      onClick={() => setFrozen((f) => !f)}
      title={frozen ? 'Click to resume dancing' : 'Click to stop dancing'}
      style={{
        transform: `${hitTransform} ${spinTransform}`,
        transition: spinning
          ? `transform ${spinMs}ms cubic-bezier(0.4, 0, 0.2, 1)`
          : 'transform 0.1s ease-out',
      }}
    >
      <svg viewBox="0 0 80 120" width="55" height="85" className="overflow-visible">
        <defs>
          <filter id="figureGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          filter="url(#figureGlow)"
          style={{
            transformOrigin: '40px 55px',
            transform: `translateY(${dancing ? activePose.bodyY : 0}px) rotate(${bowAngle}deg)`,
            transition: `transform ${bowing ? 400 : transMs}ms ease-in-out`,
          }}
        >
          {/* Head */}
          <circle cx="40" cy="14" r="7" fill="rgba(180,210,255,0.1)" stroke={stroke} strokeWidth="2" />

          {/* Spine */}
          <line x1="40" y1="21" x2="40" y2="55" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />

          {/* Left arm */}
          <g style={limbStyle('40px 30px', activePose.leftArm)}>
            <line x1="40" y1="30" x2="26" y2="44" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="26" y1="44" x2="18" y2="36" stroke={strokeDim} strokeWidth="2" strokeLinecap="round" />
            <circle cx="26" cy="44" r="1.5" fill={jointFill} />
            <circle cx="18" cy="36" r="2.5" fill={stroke} />
          </g>

          {/* Right arm */}
          <g style={limbStyle('40px 30px', activePose.rightArm)}>
            <line x1="40" y1="30" x2="54" y2="44" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="54" y1="44" x2="62" y2="36" stroke={strokeDim} strokeWidth="2" strokeLinecap="round" />
            <circle cx="54" cy="44" r="1.5" fill={jointFill} />
            <circle cx="62" cy="36" r="2.5" fill={stroke} />
          </g>

          {/* Hip joint */}
          <circle cx="40" cy="55" r="2" fill={jointFill} />

          {/* Left leg */}
          <g style={limbStyle('40px 55px', activePose.leftLeg)}>
            <line x1="40" y1="55" x2="30" y2="78" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="78" x2="26" y2="98" stroke={strokeDim} strokeWidth="2" strokeLinecap="round" />
            <circle cx="30" cy="78" r="1.5" fill={jointFill} />
            <ellipse cx="24" cy="99" rx="4" ry="2" fill={stroke} />
          </g>

          {/* Right leg */}
          <g style={limbStyle('40px 55px', activePose.rightLeg)}>
            <line x1="40" y1="55" x2="50" y2="78" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="50" y1="78" x2="54" y2="98" stroke={strokeDim} strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="78" r="1.5" fill={jointFill} />
            <ellipse cx="56" cy="99" rx="4" ry="2" fill={stroke} />
          </g>
        </g>
      </svg>
    </div>
  );
};
