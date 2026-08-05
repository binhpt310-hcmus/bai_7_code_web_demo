// Bang tra cuu ma thoi tiet WMO (weather_code) tra ve tu Open-Meteo sang
// nhan tieng Viet + nhom icon don gian. Nguon: bang "WMO Weather interpretation
// codes" cong khai cua Open-Meteo (https://open-meteo.com/en/docs).
export interface WeatherInfo {
  label: string;
  icon: "sun" | "partly" | "cloud" | "fog" | "rain" | "storm" | "snow";
}

const WMO_TABLE: Record<number, WeatherInfo> = {
  0: { label: "Trời quang, nắng đẹp", icon: "sun" },
  1: { label: "Chủ yếu quang mây", icon: "partly" },
  2: { label: "Có mây rải rác", icon: "partly" },
  3: { label: "Nhiều mây, âm u", icon: "cloud" },
  45: { label: "Sương mù", icon: "fog" },
  48: { label: "Sương mù đóng băng", icon: "fog" },
  51: { label: "Mưa phùn nhẹ", icon: "rain" },
  53: { label: "Mưa phùn vừa", icon: "rain" },
  55: { label: "Mưa phùn dày", icon: "rain" },
  56: { label: "Mưa phùn lạnh nhẹ", icon: "rain" },
  57: { label: "Mưa phùn lạnh dày", icon: "rain" },
  61: { label: "Mưa nhẹ", icon: "rain" },
  63: { label: "Mưa vừa", icon: "rain" },
  65: { label: "Mưa to", icon: "rain" },
  66: { label: "Mưa lạnh nhẹ", icon: "rain" },
  67: { label: "Mưa lạnh to", icon: "rain" },
  71: { label: "Tuyết rơi nhẹ", icon: "snow" },
  73: { label: "Tuyết rơi vừa", icon: "snow" },
  75: { label: "Tuyết rơi dày", icon: "snow" },
  77: { label: "Hạt tuyết nhỏ", icon: "snow" },
  80: { label: "Mưa rào nhẹ", icon: "rain" },
  81: { label: "Mưa rào vừa", icon: "rain" },
  82: { label: "Mưa rào dữ dội", icon: "rain" },
  85: { label: "Mưa tuyết nhẹ", icon: "snow" },
  86: { label: "Mưa tuyết to", icon: "snow" },
  95: { label: "Có dông", icon: "storm" },
  96: { label: "Dông kèm mưa đá nhẹ", icon: "storm" },
  99: { label: "Dông kèm mưa đá to", icon: "storm" },
};

export function describeWeatherCode(code: number): WeatherInfo {
  return WMO_TABLE[code] ?? { label: "Không rõ tình trạng thời tiết", icon: "cloud" };
}
