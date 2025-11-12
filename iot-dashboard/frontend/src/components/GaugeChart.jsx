import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
ChartJS.register(ArcElement, Tooltip);

export default function GaugeChart({ value, label, max = 100, color }) {
  const data = {
    datasets: [{
      data: [value, max - value],
      backgroundColor: [color, '#1f2937'],
      borderWidth: 0,
      circumference: 180,
      rotation: 270,
    }]
  };

  return (
    <div className="card p-8">
      <Doughnut data={data} options={{ cutout: '75%', plugins: { tooltip: { enabled: false } } }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '55%' }}>
        <span className="text-4xl font-bold text-white">{value}{label.includes('°') ? '°C' : '%'}</span>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
    </div>
  );
}