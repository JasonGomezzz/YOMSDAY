import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MapPin, MessageCircle } from "lucide-react";
import { AudioToggle } from "@/components/audio-toggle";
import { Brand } from "@/components/brand";
import { eventConfig } from "@/config/event";

export const metadata: Metadata = {
  title: "Ubicación — YOMSDAY",
  description: eventConfig.location.address,
};

export default function LocationPage() {
  const [latitude, longitude] = eventConfig.location.coordinates;

  return (
    <main className="cinematic-page location-page">
      <div className="cinematic-image" aria-hidden="true">
        <Image
          className="hero-image-desktop"
          src="/yomsday-grid-desktop.png"
          alt=""
          fill
          priority
          sizes="(max-width: 760px) 1px, 100vw"
        />
        <Image
          className="hero-image-mobile"
          src="/yomsday-grid-mobile.png"
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

      <div className="location-shell">
        <section>
          <Link className="back-link" href="/">
            <ArrowLeft size={15} aria-hidden="true" />
            Volver a la invitación
          </Link>
          <p className="location-kicker">Punto de encuentro</p>
          <h1 className="location-title">Nos vemos aquí</h1>
          <div className="address-block">
            <p>{eventConfig.location.address}</p>
            <span className="coordinates">
              {latitude}, {longitude}
            </span>
          </div>
          <div className="action-row location-actions">
            <a
              className="action-button primary"
              href={eventConfig.location.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir en Google Maps
              <ExternalLink size={15} aria-hidden="true" />
            </a>
            <a
              className="action-button"
              href={eventConfig.rsvp.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={15} aria-hidden="true" />
              Confirmar por WhatsApp
            </a>
          </div>
        </section>

        <section className="map-card" aria-label="Mapa del lugar">
          <div className="map-viewport">
            <iframe
              className="map-frame"
              src={eventConfig.location.embedUrl}
              title="Ubicación de YOMSDAY en Cruz de Motupe"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <span className="map-marker" aria-hidden="true">
              <MapPin className="map-marker-mask" />
              <MapPin className="map-marker-light" />
            </span>
          </div>
          <div className="map-caption">
            <span>
              <span className="status-dot" aria-hidden="true" />
              Ubicación confirmada
            </span>
            <span>SJL · Lima</span>
          </div>
        </section>
      </div>
    </main>
  );
}
