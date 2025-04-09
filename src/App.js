// App.js

import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoutesConfig from './Pages/Layout/Routes';
import APIConfig from './API/constants'; 
const HOSTNAME = APIConfig.hostname;
function App() {
  console.log("HOSTNAME:", APIConfig.hostname);
  return (
    <Router>
      <Routes>
        {/* Default Routes */}
        {RoutesConfig.DefaultRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}

        {/* Private Routes - Now correctly handled as an array */}
        {RoutesConfig.PrivateRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
    </Router>
  );
}

export default App;
