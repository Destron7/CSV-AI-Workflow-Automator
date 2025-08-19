import './App.css';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import CsvAnalysis from './components/CsvAnalysis';
import CsvCleaning from './components/CsvCleaning';
import { GetStarted } from './components/GetStarted';
import NotFound404 from './components/NotFound404';
import RemovedRowsView from './components/RemovedRowsView';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/csv-analysis" element={<CsvAnalysis />} />
        <Route path="/csv-cleaning" element={<CsvCleaning />} />
        <Route path="/removed-rows" element={<RemovedRowsView />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="*" element={<NotFound404 />} />
      </Routes>
    </>
  );
}

export default App;