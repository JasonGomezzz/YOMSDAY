"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AudioToggle } from "@/components/audio-toggle";
import { Brand } from "@/components/brand";
import { useExperience } from "@/components/experience-provider";
import { eventConfig } from "@/config/event";
import {
  getCountdown,
  padCountdownValue,
  type CountdownValue,
} from "@/lib/countdown";

const units: ReadonlyArray<{
  key: keyof Pick<
    CountdownValue,
    "months" | "days" | "hours" | "minutes" | "seconds"
  >;
  label: string;
}> = [
  { key: "months", label: "MESES" },
  { key: "days", label: "DÍAS" },
  { key: "hours", label: "HORAS" },
  { key: "minutes", label: "MINUTOS" },
  { key: "seconds", label: "SEGUNDOS" },
];

const targetTimestamp = new Date(eventConfig.targetInstant).getTime();

export function Invitation() {
  const { playArrival } = useExperience();
  const [countdown, setCountdown] = useState<CountdownValue | null>(null);
  const [arrivalFlash, setArrivalFlash] = useState(false);
  const arrivalPlayed = useRef(false);
  const arrived = countdown?.arrived ?? false;

  useEffect(() => {
    let timer: number;

    const update = () => {
      setCountdown(
        getCountdown(Date.now(), targetTimestamp, eventConfig.timeZone),
      );
      const nextBoundary = 1_020 - (Date.now() % 1_000);
      timer = window.setTimeout(update, nextBoundary);
    };

    update();
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!arrived || arrivalPlayed.current) return;
    arrivalPlayed.current = true;
    setArrivalFlash(true);
    playArrival();
    const timer = window.setTimeout(() => setArrivalFlash(false), 1_050);
    return () => window.clearTimeout(timer);
  }, [arrived, playArrival]);

  return (
    <main
      className={`cinematic-page${arrivalFlash ? " arrival-flash" : ""}`}
    >
      <div className="cinematic-image" aria-hidden="true">
        <Image
          className="hero-image-desktop"
          src="/yomsday-hero.png"
          alt=""
          fill
          priority
          sizes="(max-width: 760px) 1px, 100vw"
        />
        <Image
          className="hero-image-mobile"
          src="/yomsday-hero-mobile.png"
          alt=""
          fill
          priority
          sizes="(max-width: 760px) 100vw, 1px"
        />
      </div>
      <div className="atmosphere" aria-hidden="true" />
      <div className="scanline" aria-hidden="true" />

      <header className="site-header">
        <Brand />
        <AudioToggle />
      </header>

      <div className="invitation-content">
        <section className="invitation-copy" aria-labelledby="invitation-title">
          <p className="eyebrow">El cumpleaños de {eventConfig.honoree}</p>
          <h1 className="hero-title" id="invitation-title">
            {eventConfig.headline}
          </h1>
          <div className="event-meta">
            <span>{eventConfig.displayDate}</span>
            <span className="meta-divider" aria-hidden="true" />
            <span>Hora de Lima</span>
          </div>

          {arrived ? (
            <div className="arrival-message" role="status" aria-live="polite">
              <p>{eventConfig.arrivalHeadline}</p>
            </div>
          ) : (
            <div
              className="countdown"
              role="timer"
              aria-label="Cuenta regresiva hasta el cumpleaños de Yonsito"
            >
              {units.map(({ key, label }) => (
                <div className="time-unit" key={key}>
                  <span className="time-value">
                    {countdown ? padCountdownValue(countdown[key]) : "--"}
                  </span>
                  <span className="time-label">{label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="action-row">
            <Link className="action-button primary" href="/ubicacion">
              <MapPin size={16} aria-hidden="true" />
              Ver ubicación
            </Link>
            <a
              className="action-button"
              href={eventConfig.rsvp.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={16} aria-hidden="true" />
              Confirmar asistencia
            </a>
          </div>
          <p className="location-note">
            Cruz de Motupe · San Juan de Lurigancho · Lima
          </p>
        </section>
      </div>
    </main>
  );
}
