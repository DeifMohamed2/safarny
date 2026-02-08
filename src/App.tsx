import "./mock";
import "react-phone-number-input/style.css";
import { lazy } from "react";
import Layout from "./components/layouts/Layout";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./auth";
const Home = lazy(() => import('./pages/Home'))
const NotFound = lazy(() => import('./pages/not-found'))

const routers = createBrowserRouter([
  {
    path: "",
    element: (
      <AuthProvider>
        <Layout />
      </AuthProvider>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "trips", element: <Home /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={routers} />;
}

export default App;
