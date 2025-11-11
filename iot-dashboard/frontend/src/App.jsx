import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Header from './components/Header';
import Dashboard from './components/Dashboard';

const socket = io('http://localhost:5000');

function App() {
  const [isDark, setIsDark] = useState(true);
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    fetch('http://localhost:5000/api/latest').then(r => r.json()).then(setLatest);
    fetch('http://localhost:5000/api/history').then(r => r.json()).then(setHistory);

    socket.on('new-data', (data) => {
      setLatest(data);
      setHistory(prev => [...prev.slice(-49), data]);
    });

    return () => socket.off('new-data');
  }, [isDark]);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900' : 'bg-gradient-to-br from-blue-50 to-green-50'} p-6`}>
      <div className="max-w-7xl mx-auto">
        <Header isDark={isDark} setIsDark={setIsDark} latest={latest} />
        <Dashboard latest={latest} history={history} />
      </div>
    </div>
  );
}

export default App;