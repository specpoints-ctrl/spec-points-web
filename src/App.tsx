import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">SpecPoints</h1>
                <p className="text-lg text-gray-600 mb-8">
                  SaaS de Fidelidade para Especificadores
                </p>
                <div className="bg-white p-8 rounded-lg shadow-lg">
                  <p className="text-gray-700">🚀 Sistema em construção</p>
                  <p className="text-sm text-gray-500 mt-2">Semana 1: Setup Base + Autenticação</p>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
