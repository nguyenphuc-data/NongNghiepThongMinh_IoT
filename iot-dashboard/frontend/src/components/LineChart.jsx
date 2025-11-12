import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

export default function LineChart({ data, field, label, color }) {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-500">Chưa có dữ liệu</div>;

  const labels = data.map(item => {
    const date = new Date(item.received_at);
    date.setHours(date.getHours() + 7);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  });

  const values = data.map(item => item[field]);

  const chartData = {
    labels,
    datasets: [{
      label,
      data: values,
      borderColor: color,
      backgroundColor: color + '40',
      tension: 0.4,
      pointRadius: 4,
      fill: false
    }]
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Lịch sử {label}</h3>
      <div className="h-64"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
    </div>
  );
}