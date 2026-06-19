export type OfficeLocation = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
};

export type NearestOffice = {
  office: OfficeLocation;
  distanceKm: number;
};

export const DEFAULT_OFFICES: OfficeLocation[] = [
  {
    id: "seoul",
    name: "ETHOS Seoul Office",
    address: "Gangnam-gu, Seoul, South Korea",
    lat: 37.4979,
    lng: 127.0276,
    phone: "+82-2-555-0100",
  },
  {
    id: "busan",
    name: "ETHOS Busan Office",
    address: "Haeundae-gu, Busan, South Korea",
    lat: 35.1631,
    lng: 129.1635,
    phone: "+82-51-555-0200",
  },
  {
    id: "daegu",
    name: "ETHOS Daegu Office",
    address: "Jung-gu, Daegu, South Korea",
    lat: 35.8703,
    lng: 128.5911,
    phone: "+82-53-555-0300",
  },
];

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestOffices(
  lat: number,
  lng: number,
  limit = DEFAULT_OFFICES.length
): NearestOffice[] {
  return DEFAULT_OFFICES.map((office) => ({
    office,
    distanceKm: haversineKm(lat, lng, office.lat, office.lng),
  }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function getOfficeById(id: string): OfficeLocation | null {
  return DEFAULT_OFFICES.find((o) => o.id === id) ?? null;
}

export function getAllOffices(): OfficeLocation[] {
  return [...DEFAULT_OFFICES];
}
