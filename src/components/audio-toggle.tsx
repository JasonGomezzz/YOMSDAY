"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useExperience } from "@/components/experience-provider";

export function AudioToggle() {
  const { muted, soundEnabled, toggleMute } = useExperience();
  const isAudible = soundEnabled && !muted;
  const label = isAudible ? "Silenciar ambiente" : "Activar ambiente";

  return (
    <button
      type="button"
      className="sound-button"
      aria-label={label}
      title={label}
      onClick={() => void toggleMute()}
    >
      {isAudible ? <Volume2 size={17} /> : <VolumeX size={17} />}
    </button>
  );
}
