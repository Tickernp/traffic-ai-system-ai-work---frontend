export type TrafficSettings = {
  simulation: {
    speedMultiplier: number;
    trafficDensity: "LOW" | "NORMAL" | "HIGH";
    startingWeather: "NORMAL" | "RUSH HOUR" | "HEAVY RAIN";
  };
  vehicleMix: {
    motorcyclePercent: number;
    truckPercent: number;
  };
  videoAI: {
    trackingEnabled: boolean;
    confidence: number;
  };
  data: {
    refreshIntervalSeconds: number;
  };
};

export const TRAFFIC_SETTINGS_KEY = "traffic-lab-settings-v1";

export const DEFAULT_TRAFFIC_SETTINGS: TrafficSettings = {
  simulation: {
    speedMultiplier: 1,
    trafficDensity: "NORMAL",
    startingWeather: "NORMAL",
  },
  vehicleMix: {
    motorcyclePercent: 22,
    truckPercent: 12,
  },
  videoAI: {
    trackingEnabled: true,
    confidence: 0.25,
  },
  data: {
    refreshIntervalSeconds: 3,
  },
};

export function loadTrafficSettings(): TrafficSettings {
  if (typeof window === "undefined") return DEFAULT_TRAFFIC_SETTINGS;

  try {
    const saved = window.localStorage.getItem(TRAFFIC_SETTINGS_KEY);
    if (!saved) return DEFAULT_TRAFFIC_SETTINGS;
    const parsed = JSON.parse(saved) as Partial<TrafficSettings>;
    return {
      simulation: { ...DEFAULT_TRAFFIC_SETTINGS.simulation, ...parsed.simulation },
      vehicleMix: { ...DEFAULT_TRAFFIC_SETTINGS.vehicleMix, ...parsed.vehicleMix },
      videoAI: { ...DEFAULT_TRAFFIC_SETTINGS.videoAI, ...parsed.videoAI },
      data: { ...DEFAULT_TRAFFIC_SETTINGS.data, ...parsed.data },
    };
  } catch {
    return DEFAULT_TRAFFIC_SETTINGS;
  }
}

export function saveTrafficSettings(settings: TrafficSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRAFFIC_SETTINGS_KEY, JSON.stringify(settings));
}
