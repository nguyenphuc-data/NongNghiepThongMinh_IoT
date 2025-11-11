import StatsCard from './StatsCard';
import GaugeChart from './GaugeChart';
import LineChart from './LineChart';
import { Thermometer, Droplets, Cloud, Sun, CloudRain } from 'lucide-react';

export default function Dashboard({ latest, history }) {
  if (!latest) return <div className="text-center py-20 text-white">Đang tải dữ liệu...</div>;

  const isDay = latest.is_bright ? "Ban ngày" : "Ban đêm";
  const sunIcon = latest.is_bright ? "Sun" : "Moon";

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard title="Nhiệt độ" value={latest.temp} unit="°C" icon={Thermometer} color="text-orange-400" />
        <StatsCard title="Độ ẩm KK" value={latest.hum} unit="%" icon={Droplets} color="text-blue-400" />
        <StatsCard title="Độ ẩm đất" value={latest.soil_percent} unit="%" icon={Cloud} color="text-green-400" />
        <StatsCard title="Tỉ lệ mưa" value={latest.rain_percent} unit="%" icon={CloudRain} color="text-cyan-400" />
        <StatsCard title="Thời điểm" value={isDay} icon={latest.is_bright ? Sun : Moon} color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <GaugeChart value={latest.hum} label="Độ ẩm KK" color="#3b82f6" />
        <GaugeChart value={latest.soil_percent} label="Độ ẩm đất" color="#10b981" />
        <GaugeChart value={latest.rain_percent} label="Tỉ lệ mưa" color="#06b6d4" />
        <GaugeChart value={latest.temp} max={50} label="Nhiệt độ" color="#f97316" />
      </div>

      <LineChart data={history} field="temp" label="Nhiệt độ (°C)" color="#f97316" />
    </div>
  );
}