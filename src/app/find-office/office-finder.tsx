"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";

type OfficeWithDistance = {
  id: string;
  name: string;
  address: string;
  phone: string;
  distanceKm: number | null;
};

export function OfficeFinder() {
  const [offices, setOffices] = useState<OfficeWithDistance[]>([]);
  const [status, setStatus] = useState<string>("Requesting location...");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const loadFromApi = async (lat?: number, lng?: number) => {
      const qs =
        typeof lat === "number" && typeof lng === "number"
          ? `?lat=${lat}&lng=${lng}`
          : "";
      const res = await fetch(`/api/public/offices${qs}`);
      const json = (await res.json()) as {
        offices: OfficeWithDistance[];
      };
      setOffices(json.offices);
    };

    if (!navigator.geolocation) {
      setStatus("Geolocation not supported. Showing all offices.");
      loadFromApi();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus(
          `Sorted by distance from (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}).`
        );
        loadFromApi(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setStatus("Location denied. Showing all offices.");
        loadFromApi();
      }
    );
  }, []);

  const handleCopy = async (address: string, id: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{status}</p>
      <div className="grid gap-4">
        {offices.map((o) => (
          <Card key={o.id}>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{o.name}</h3>
                  <p className="text-sm text-muted-foreground">{o.address}</p>
                </div>
                {o.distanceKm !== null ? (
                  <span className="text-sm font-medium">
                    {o.distanceKm.toFixed(1)} km
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <a
                  href={`tel:${o.phone}`}
                  className="underline"
                >
                  {o.phone}
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(o.address, o.id)}
                  className="text-xs px-2 py-1 border rounded"
                >
                  {copied === o.id ? "Copied!" : "Copy address"}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
