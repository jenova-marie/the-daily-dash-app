import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, CloudLightning, CloudDrizzle, ArrowUp, ArrowDown } from "lucide-react";

// WMO weather code mapping
const getConditionFromCode = (code) => {
  if (code === 0) return { label: "Clear", Icon: Sun };
  if (code <= 3) return { label: "Cloudy", Icon: Cloud };
  if (code <= 49) return { label: "Fog", Icon: Cloud };
  if (code <= 59) return { label: "Drizzle", Icon: CloudDrizzle };
  if (code <= 69) return { label: "Rain", Icon: CloudRain };
  if (code <= 79) return { label: "Snow", Icon: CloudSnow };
  if (code <= 82) return { label: "Showers", Icon: CloudRain };
  if (code <= 99) return { label: "Thunder", Icon: CloudLightning };
  return { label: "Wind", Icon: Wind };
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const aqiColor = (aqi) => {
  if (aqi <= 50) return "#22c55e";   // Good
  if (aqi <= 100) return "#eab308";  // Moderate
  if (aqi <= 150) return "#f97316";  // Unhealthy for sensitive
  if (aqi <= 200) return "#ef4444";  // Unhealthy
  if (aqi <= 300) return "#a855f7";  // Very unhealthy
  return "#7f1d1d";                  // Hazardous
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    // Check cache first (30 min TTL)
    try {
      const cached = JSON.parse(localStorage.getItem("weather_cache_v3") || "null");
      if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
        setWeather(cached.data);
        setLoading(false);
        return;
      }
    } catch {}

    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocode for city name (free nominatim)
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const geoData = await geoRes.json();
          const location =
            geoData.address?.city ||
            geoData.address?.town ||
            geoData.address?.village ||
            geoData.address?.county ||
            "Your Location";

          // Fetch weather + AQI from Open-Meteo (free, no key)
          const [weatherRes, aqiRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
              `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
              `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
              `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`
            ),
            fetch(
              `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
              `&current=us_aqi&timezone=auto`
            ),
          ]);
          const data = await weatherRes.json();
          const aqiData = await aqiRes.json();

          const result = {
            location,
            current: {
              temp: data.current.temperature_2m,
              feels_like: data.current.apparent_temperature,
              humidity: data.current.relative_humidity_2m,
              wind_speed: Math.round(data.current.wind_speed_10m),
              weather_code: data.current.weather_code,
              high: data.daily.temperature_2m_max[0],
              low: data.daily.temperature_2m_min[0],
              aqi: aqiData.current?.us_aqi ?? null,
            },
            forecast: data.daily.time.map((date, i) => ({
              day: DAYS[new Date(date).getUTCDay()],
              high: data.daily.temperature_2m_max[i],
              low: data.daily.temperature_2m_min[i],
              weather_code: data.daily.weather_code[i],
            })),
          };

          localStorage.setItem("weather_cache_v3", JSON.stringify({ data: result, timestamp: Date.now() }));
          setWeather(result);
        } catch {
          // ignore
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="text-center text-muted-foreground text-sm py-4">
        Enable location to see weather
      </div>
    );
  }

  const { Icon, label } = getConditionFromCode(weather.current?.weather_code);

  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Today</h4>
      <div className="flex items-center gap-4 mb-3">
        <Icon className="w-12 h-12 text-accent" />
        <div>
          <div className="text-3xl font-bold">{Math.round(weather.current?.temp || 0)}°F</div>
          <div className="text-sm text-muted-foreground">{label} · {weather.location}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-0.5 text-xs text-orange-400 font-medium">
              <ArrowUp className="w-3 h-3" />{Math.round(weather.current?.high || 0)}°
            </span>
            <span className="flex items-center gap-0.5 text-xs text-blue-400 font-medium">
              <ArrowDown className="w-3 h-3" />{Math.round(weather.current?.low || 0)}°
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-6 pb-6 border-b border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Thermometer className="w-3.5 h-3.5" />
          Feels {Math.round(weather.current?.feels_like || 0)}°
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Droplets className="w-3.5 h-3.5" />
          {weather.current?.humidity || 0}%
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Wind className="w-3.5 h-3.5" />
          {weather.current?.wind_speed || 0} mph
        </div>
        {weather.current?.aqi != null && (
          <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: aqiColor(weather.current.aqi) }}>
            AQI {weather.current.aqi}
          </div>
        )}
      </div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">6-Day Forecast</h4>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(weather.forecast || []).slice(1, 7).map((day, i) => {
          const { Icon: DayIcon } = getConditionFromCode(day.weather_code);
          return (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[52px] py-2 px-1 rounded-lg bg-muted/50 text-xs">
              <span className="font-medium">{day.day}</span>
              <DayIcon className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{Math.round(day.high || 0)}°</span>
              <span className="text-muted-foreground">{Math.round(day.low || 0)}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}