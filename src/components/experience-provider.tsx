"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ExperienceContextValue = {
  entered: boolean;
  muted: boolean;
  soundEnabled: boolean;
  enter: (withSound: boolean) => Promise<void>;
  toggleMute: () => Promise<void>;
  playArrival: () => void;
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

type AudioEngine = {
  context: AudioContext;
  element: HTMLAudioElement;
  master: GainNode;
};

function buildAudioEngine(): AudioEngine {
  const context = new AudioContext();
  const element = new Audio("/yomsday-clock.mp3");
  element.loop = true;
  element.preload = "auto";
  element.crossOrigin = "anonymous";

  const source = context.createMediaElementSource(element);
  const master = context.createGain();
  master.gain.value = 0.72;
  source.connect(master);
  master.connect(context.destination);

  return { context, element, master };
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(false);
  const [muted, setMuted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const engineRef = useRef<AudioEngine | null>(null);

  const startSound = useCallback(async () => {
    const engine = engineRef.current ?? buildAudioEngine();
    engineRef.current = engine;

    if (engine.context.state === "suspended") {
      await engine.context.resume();
    }

    engine.master.gain.cancelScheduledValues(engine.context.currentTime);
    engine.master.gain.setTargetAtTime(0.72, engine.context.currentTime, 0.04);
    await engine.element.play();
    setSoundEnabled(true);
    setMuted(false);
  }, []);

  const enter = useCallback(
    async (withSound: boolean) => {
      setEntered(true);
      if (!withSound) return;

      try {
        await startSound();
      } catch {
        setSoundEnabled(false);
        setMuted(true);
      }
    },
    [startSound],
  );

  const toggleMute = useCallback(async () => {
    if (!soundEnabled || !engineRef.current) {
      try {
        await startSound();
      } catch {
        setMuted(true);
      }
      return;
    }

    const engine = engineRef.current;
    const nextMuted = !muted;
    engine.master.gain.cancelScheduledValues(engine.context.currentTime);
    engine.master.gain.setTargetAtTime(
      nextMuted ? 0.0001 : 0.72,
      engine.context.currentTime,
      0.04,
    );
    setMuted(nextMuted);
  }, [muted, soundEnabled, startSound]);

  const playArrival = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !soundEnabled || muted || engine.context.state !== "running") {
      return;
    }

    engine.element.pause();

    const now = engine.context.currentTime;
    const impact = engine.context.createOscillator();
    const impactGain = engine.context.createGain();
    impact.type = "sine";
    impact.frequency.setValueAtTime(72, now);
    impact.frequency.exponentialRampToValueAtTime(31, now + 0.72);
    impactGain.gain.setValueAtTime(0.3, now);
    impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    impact.connect(impactGain);
    impactGain.connect(engine.master);

    const buffer = engine.context.createBuffer(
      1,
      Math.floor(engine.context.sampleRate * 0.48),
      engine.context.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      const falloff = 1 - index / data.length;
      data[index] = (Math.random() * 2 - 1) * falloff;
    }

    const noise = engine.context.createBufferSource();
    const noiseFilter = engine.context.createBiquadFilter();
    const noiseGain = engine.context.createGain();
    noise.buffer = buffer;
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 520;
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(engine.master);

    impact.start(now);
    impact.stop(now + 0.82);
    noise.start(now);
  }, [muted, soundEnabled]);

  useEffect(() => {
    return () => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.element.pause();
      engine.element.src = "";
      void engine.context.close();
    };
  }, []);

  const value = useMemo(
    () => ({
      entered,
      muted,
      soundEnabled,
      enter,
      toggleMute,
      playArrival,
    }),
    [entered, muted, soundEnabled, enter, toggleMute, playArrival],
  );

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience(): ExperienceContextValue {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperience must be used inside ExperienceProvider");
  }
  return context;
}
