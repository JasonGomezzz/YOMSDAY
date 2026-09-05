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
  master: GainNode;
  bufferPromise: Promise<AudioBuffer>;
  source: AudioBufferSourceNode | null;
};

function buildAudioEngine(): AudioEngine {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0.72;
  master.connect(context.destination);

  const bufferPromise = fetch("/yomsday-clock.mp3")
    .then((response) => {
      if (!response.ok) throw new Error("No se pudo cargar el audio de YOMSDAY");
      return response.arrayBuffer();
    })
    .then((audioData) => context.decodeAudioData(audioData));

  return { context, master, bufferPromise, source: null };
}

function startInfiniteLoop(engine: AudioEngine, buffer: AudioBuffer) {
  if (engine.source) return;

  const source = engine.context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = buffer.duration;
  source.connect(engine.master);
  source.start(0);
  engine.source = source;
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

    const buffer = await engine.bufferPromise;
    startInfiniteLoop(engine, buffer);
    engine.master.gain.cancelScheduledValues(engine.context.currentTime);
    engine.master.gain.setTargetAtTime(0.72, engine.context.currentTime, 0.04);
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

    engine.source?.stop();
    engine.source = null;

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
      engine.source?.stop();
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
