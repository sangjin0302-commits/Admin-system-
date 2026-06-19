import { NextResponse } from "next/server";

import {
  findNearestOffices,
  getAllOffices,
} from "@/lib/services/location-service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");

  if (latStr && lngStr) {
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const nearest = findNearestOffices(lat, lng);
      return NextResponse.json({
        offices: nearest.map((n) => ({
          id: n.office.id,
          name: n.office.name,
          address: n.office.address,
          phone: n.office.phone,
          distanceKm: n.distanceKm,
        })),
      });
    }
  }

  return NextResponse.json({
    offices: getAllOffices().map((o) => ({
      id: o.id,
      name: o.name,
      address: o.address,
      phone: o.phone,
      distanceKm: null,
    })),
  });
}
