export default function StatsCard({ title, value, unit, icon: Icon, color, trend }) {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend && <span className="text-xs text-emerald-400">↑ {trend}</span>}
      </div>
      <h3 className="text-sm font-medium text-gray-300 mb-1">{title}</h3>
      <p className="stat-value">{value}{unit}</p>
      <div className="flex items-center mt-2">
        <span className="realtime-dot"></span>
        <span className="text-xs text-gray-400 ml-2">Cập nhật realtime</span>
      </div>
    </div>
  );
}