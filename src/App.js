// App.js

import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoutesConfig from './Pages/Layout/Routes';

function App() {
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
