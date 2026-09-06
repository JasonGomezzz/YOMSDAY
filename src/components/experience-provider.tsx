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
  muted: boolean;
  soundEnabled: boolean;
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
  const [muted, setMuted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const engineRef = useRef<AudioEngine | null>(null);

  const startSound = useCallback(async () => {
    const currentEngine = engineRef.current;
    const engine =
      currentEngine && currentEngine.context.state !== "closed"
        ? currentEngine
        : buildAudioEngine();
    engineRef.current = engine;

    if (engine.context.state !== "running") {
      await engine.context.resume();
    }

    if (engine.context.state !== "running") {
      throw new Error("El navegador requiere interacción para activar el audio");
    }

    const buffer = await engine.bufferPromise;
    startInfiniteLoop(engine, buffer);
    engine.master.gain.cancelScheduledValues(engine.context.currentTime);
    engine.master.gain.setTargetAtTime(0.72, engine.context.currentTime, 0.04);
    setSoundEnabled(true);
    setMuted(false);
  }, []);

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
    if (!nextMuted && engine.context.state !== "running") {
      await engine.context.resume();
    }
    engine.master.gain.cancelScheduledValues(engine.context.currentTime);
    engine.master.gain.setTargetAtTime(
      nextMuted ? 0.0001 : 0.72,
      engine.context.currentTime,
      0.04,
    );
    setMuted(nextMuted);
  }, [muted, soundEnabled, startSound]);

  useEffect(() => {
    if (soundEnabled) return;

    const activateSound = () => {
      void startSound().catch(() => {
        // If autoplay is denied, keep waiting for a valid visitor gesture.
      });
    };

    document.addEventListener("pointerdown", activateSound, {
      capture: true,
      passive: true,
    });
    document.addEventListener("touchstart", activateSound, {
      capture: true,
      passive: true,
    });
    document.addEventListener("click", activateSound, true);
    document.addEventListener("keydown", activateSound, true);

    // Browsers that already trust this domain can begin immediately.
    activateSound();

    return () => {
      document.removeEventListener("pointerdown", activateSound, true);
      document.removeEventListener("touchstart", activateSound, true);
      document.removeEventListener("click", activateSound, true);
      document.removeEventListener("keydown", activateSound, true);
    };
  }, [soundEnabled, startSound]);

  useEffect(() => {
    if (!soundEnabled || muted) return;

    const resumeSound = () => {
      const engine = engineRef.current;
      if (
        document.visibilityState === "visible" &&
        engine?.context.state === "suspended"
      ) {
        void engine.context.resume();
      }
    };

    document.addEventListener("visibilitychange", resumeSound);
    window.addEventListener("pageshow", resumeSound);

    return () => {
      document.removeEventListener("visibilitychange", resumeSound);
      window.removeEventListener("pageshow", resumeSound);
    };
  }, [muted, soundEnabled]);

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
      engineRef.current = null;
    };
  }, []);

  const value = useMemo(
    () => ({
      muted,
      soundEnabled,
      toggleMute,
      playArrival,
    }),
    [muted, soundEnabled, toggleMute, playArrival],
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
