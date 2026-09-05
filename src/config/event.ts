export type EventConfig = {
  headline: string;
  arrivalHeadline: string;
  honoree: string;
  targetInstant: string;
  timeZone: string;
  displayDate: string;
  shortDate: string;
  location: {
    address: string;
    coordinates: readonly [number, number];
    mapsUrl: string;
    embedUrl: string;
  };
  rsvp: {
    phone: string;
    message: string;
    url: string;
  };
};

const rsvpMessage =
  "Hola, confirmo mi asistencia al cumpleaños de Yonsito 🎉. Mi nombre es: _____.";

export const eventConfig = {
  headline: "YOMSDAY IS COMING",
  arrivalHeadline: "YOMSDAY HAS ARRIVED",
  honoree: "Yonsito",
  targetInstant: "2026-09-27T03:00:00.000Z",
  timeZone: "America/Lima",
  displayDate: "26 septiembre 2026 · 10:00 PM",
  shortDate: "26.09.26",
  location: {
    address:
      "Calle 52, altura del Mercado 11 de Enero, Cruz de Motupe, San Juan de Lurigancho",
    coordinates: [-11.938438, -76.978771],
    mapsUrl: "https://maps.app.goo.gl/JCp4pQnNRCarWZVt9",
    embedUrl:
      "https://www.google.com/maps?q=-11.938438,-76.978771&z=17&output=embed",
  },
  rsvp: {
    phone: "51903369804",
    message: rsvpMessage,
    url: `https://wa.me/51903369804?text=${encodeURIComponent(rsvpMessage)}`,
  },
} as const satisfies EventConfig;
