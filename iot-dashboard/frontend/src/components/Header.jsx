import { useState } from 'react';
import { Sun, Moon, CloudRain, Thermometer, Droplets } from 'lucide-react';

export default function Header({ isDark, setIsDark, latest }) {
  return (
    <header className="glass mb-8 p-6 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-emerald-500 bg-opacity-20 rounded-xl">
          <Thermometer className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Nông Nghiệp Thông Minh</h1>
          <p className="text-sm text-gray-300">Hệ thống giám sát IoT thời gian thực</p>
        </div>
      </div>
      <button
        onClick={() => setIsDark(!isDark)}
        className="p-3 glass rounded-xl hover:bg-white hover:bg-opacity-20 transition-all"
      >
        {isDark ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-blue-400" />}
      </button>
    </header>
  );
}