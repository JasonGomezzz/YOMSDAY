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
import { eventConfig } from "@/config/event";

type ExperienceContextValue = {
  entered: boolean;
  muted: boolean;
  soundEnabled: boolean;
  enter: (withSound: boolean) => Promise<void>;
  toggleMute: () => Promise<void>;
  playTick: () => void;
  playArrival: () => void;
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

type AudioEngine = {
  context: AudioContext;
  master: GainNode;
  sources: OscillatorNode[];
};

function buildAudioEngine(): AudioEngine {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(0.55, context.currentTime + 0.75);
  master.connect(context.destination);

  const ambientGain = context.createGain();
  ambientGain.gain.value = 0.065;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 175;
  filter.Q.value = 0.8;
  ambientGain.connect(filter);
  filter.connect(master);

  const lowDrone = context.createOscillator();
  lowDrone.type = "sine";
  lowDrone.frequency.value = 43;
  lowDrone.connect(ambientGain);

  const overtone = context.createOscillator();
  overtone.type = "triangle";
  overtone.frequency.value = 64.5;
  const overtoneGain = context.createGain();
  overtoneGain.gain.value = 0.16;
  overtone.connect(overtoneGain);
  overtoneGain.connect(ambientGain);

  const lfo = context.createOscillator();
  lfo.frequency.value = 0.075;
  const lfoGain = context.createGain();
  lfoGain.gain.value = 0.018;
  lfo.connect(lfoGain);
  lfoGain.connect(ambientGain.gain);

  lowDrone.start();
  overtone.start();
  lfo.start();

  return { context, master, sources: [lowDrone, overtone, lfo] };
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(false);
  const [muted, setMuted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const engineRef = useRef<AudioEngine | null>(null);
  const tickIndexRef = useRef(0);

  const startSound = useCallback(async () => {
    const engine = engineRef.current ?? buildAudioEngine();
    engineRef.current = engine;

    if (engine.context.state === "suspended") {
      await engine.context.resume();
    }

    engine.master.gain.cancelScheduledValues(engine.context.currentTime);
    engine.master.gain.setTargetAtTime(0.55, engine.context.currentTime, 0.08);
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
      nextMuted ? 0.0001 : 0.55,
      engine.context.currentTime,
      0.05,
    );
    setMuted(nextMuted);
  }, [muted, soundEnabled, startSound]);

  const playTick = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !soundEnabled || muted || engine.context.state !== "running") {
      return;
    }

    const now = engine.context.currentTime;
    const isTock = tickIndexRef.current % 2 === 1;
    tickIndexRef.current += 1;
    const oscillator = engine.context.createOscillator();
    const gain = engine.context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(isTock ? 1_050 : 1_650, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      isTock ? 520 : 760,
      now + 0.055,
    );
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
    oscillator.connect(gain);
    gain.connect(engine.master);

    const body = engine.context.createOscillator();
    const bodyGain = engine.context.createGain();
    body.type = "sine";
    body.frequency.setValueAtTime(isTock ? 112 : 148, now);
    body.frequency.exponentialRampToValueAtTime(72, now + 0.075);
    bodyGain.gain.setValueAtTime(0.12, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    body.connect(bodyGain);
    bodyGain.connect(engine.master);

    oscillator.start(now);
    oscillator.stop(now + 0.09);
    body.start(now);
    body.stop(now + 0.105);
  }, [muted, soundEnabled]);

  useEffect(() => {
    if (!soundEnabled || muted) return;

    const targetTimestamp = new Date(eventConfig.targetInstant).getTime();
    let timer: number;

    const scheduleTick = () => {
      if (Date.now() >= targetTimestamp) return;
      playTick();
      timer = window.setTimeout(scheduleTick, 1_020 - (Date.now() % 1_000));
    };

    scheduleTick();
    return () => window.clearTimeout(timer);
  }, [muted, playTick, soundEnabled]);

  const playArrival = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !soundEnabled || muted || engine.context.state !== "running") {
      return;
    }

    const now = engine.context.currentTime;
    const impact = engine.context.createOscillator();
    const impactGain = engine.context.createGain();
    impact.type = "sine";
    impact.frequency.setValueAtTime(72, now);
    impact.frequency.exponentialRampToValueAtTime(31, now + 0.72);
    impactGain.gain.setValueAtTime(0.22, now);
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
    noiseGain.gain.setValueAtTime(0.09, now);
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
      engine.sources.forEach((source) => source.stop());
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
      playTick,
      playArrival,
    }),
    [entered, muted, soundEnabled, enter, toggleMute, playTick, playArrival],
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
