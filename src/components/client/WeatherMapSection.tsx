"use client";

import { useEffect, useState } from "react";
import {
  ArrowSquareOutIcon,
  CloudIcon,
  CloudFogIcon,
  CloudLightningIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudSunIcon,
  DropIcon,
  MapPinIcon,
  SunIcon,
  WindIcon,
} from "@phosphor-icons/react/ssr";
import { describeWeatherCode, type WeatherInfo } from "@/lib/weather";

// Toa do gan dung cua quan (khu vuc thap Bitexco, Quan 1, TP.HCM).
const SHOP_LAT = 10.7717;
const SHOP_LON = 106.704;

const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${SHOP_LAT}&longitude=${SHOP_LON}` +
  `&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=Asia%2FBangkok`;

const MAP_BBOX = "106.6940,10.7617,106.7140,10.7817";
const OSM_EMBED_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${MAP_BBOX}&marker=${SHOP_LAT},${SHOP_LON}`;
const GOOGLE_MAPS_URL = `https://www.google.com/maps?q=${SHOP_LAT},${SHOP_LON}`;

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  info: WeatherInfo;
}

const WEATHER_ICONS: Record<WeatherInfo["icon"], typeof SunIcon> = {
  sun: SunIcon,
  partly: CloudSunIcon,
  cloud: CloudIcon,
  fog: CloudFogIcon,
  rain: CloudRainIcon,
  storm: CloudLightningIcon,
  snow: CloudSnowIcon,
};

export function WeatherMapSection() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    async function loadWeather() {
      try {
        const res = await fetch(WEATHER_URL);
        if (!res.ok) throw new Error("weather fetch failed");
        const data = await res.json();
        const current = data?.current;
        if (!current || typeof current.temperature_2m !== "number") {
          throw new Error("invalid weather payload");
        }
        if (cancelled) return;
        setWeather({
          temperature: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          windSpeed: current.wind_speed_10m,
          info: describeWeatherCode(current.weather_code),
        });
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    loadWeather();
    return () => {
      cancelled = true;
    };
  }, []);

  const WeatherIcon = weather ? WEATHER_ICONS[weather.info.icon] : CloudSunIcon;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
          Vị trí & thời tiết
        </p>
        <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
          Ghé quán hôm nay
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col justify-between rounded-2xl bg-surface p-6 shadow-soft">
          {status === "loading" && (
            <div className="flex flex-1 animate-pulse flex-col gap-3">
              <div className="h-10 w-2/3 rounded-lg bg-ink/6" />
              <div className="h-4 w-1/2 rounded-lg bg-ink/6" />
              <div className="h-4 w-1/3 rounded-lg bg-ink/6" />
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-1 flex-col items-start justify-center gap-2">
              <CloudSunIcon size={32} weight="light" className="text-muted/60" />
              <p className="text-sm font-medium text-ink">Chưa lấy được thời tiết</p>
              <p className="text-sm text-muted">
                Không thể kết nối dịch vụ thời tiết lúc này, bạn vui lòng thử tải lại trang.
              </p>
            </div>
          )}

          {status === "ready" && weather && (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
                  <WeatherIcon size={26} weight="fill" />
                </span>
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-ink">
                    {Math.round(weather.temperature)}°C
                  </p>
                  <p className="text-sm text-muted">{weather.info.label}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-5 border-t border-border pt-4 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <DropIcon size={16} weight="bold" />
                  Độ ẩm {Math.round(weather.humidity)}%
                </span>
                <span className="flex items-center gap-1.5">
                  <WindIcon size={16} weight="bold" />
                  Gió {Math.round(weather.windSpeed)} km/h
                </span>
              </div>
              <p className="mt-3 text-xs text-muted/80">
                Dữ liệu thời tiết khu vực trung tâm Quận 1, cập nhật theo thời gian thực từ
                Open-Meteo.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow-soft">
          <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
            <iframe
              title="Bản đồ vị trí quán"
              src={OSM_EMBED_URL}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
            />
          </div>
          <div className="flex items-center justify-between gap-3 p-4">
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <MapPinIcon size={16} weight="bold" className="text-accent" />
              24 Nguyễn Huệ, Quận 1, TP.HCM
            </p>
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/30"
            >
              Mở trong Google Maps
              <ArrowSquareOutIcon size={15} weight="bold" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
