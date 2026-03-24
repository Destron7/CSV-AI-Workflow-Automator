import './App.css';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import { Particles } from './components/ui/particles';
import CsvAnalysis from './pages/CsvAnalysis';
import CsvCleaning from './pages/CsvCleaning';

import NotFound404 from './pages/NotFound404';
import RemovedRowsView from './pages/RemovedRowsView';
import Chat from './pages/Chat';
import DashboardChat from './pages/DashboardChat';
import { GoToHomeButton } from './components/ui/GoToHomeButton';

function App() {
  return (
    <div className="relative min-h-screen w-full bg-black">
      <Particles
        className="fixed inset-0 z-0"
        quantity={200}
        ease={80}
        color="#ffffff"
        refresh
      />
      <div className="relative z-10">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/csv-analysis" element={<CsvAnalysis />} />
          <Route path="/csv-cleaning" element={<CsvCleaning />} />
          <Route path="/removed-rows" element={<RemovedRowsView />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/dashboard" element={<DashboardChat />} />

          <Route path="*" element={<NotFound404 />} />
        </Routes>
        <GoToHomeButton />
      </div>
    </div>
  );
}

export default App;