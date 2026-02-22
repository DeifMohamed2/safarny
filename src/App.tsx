import "./mock";
import "react-phone-number-input/style.css";
import { lazy } from "react";
import Layout from "./components/layouts/Layout";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./auth";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Offers from "./pages/Offers";
import Umrah from "./pages/Umrah";
import Trips from "./pages/Trips";
import CompanyProfile from "./pages/CompanyProfile";
import SearchCompanies from "./pages/SearchCompanies";
import Companies from "./pages/Companies";
import Profile from "./pages/Profile";
import BookingHistory from "./pages/BookingHistory";
import ContactUs from "./pages/ContactUs";
// const Home = lazy(() => import('./pages/Home'))
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
      { path: 'search', element: <Search /> },
      { path: "trips", element: <Trips /> },
      { path: "trips/offers", element: <Offers /> },
      { path: "umrah", element: <Umrah /> },
      { path: "companies", element: <Companies /> },
      { path: "company-profile", element: <CompanyProfile /> },
      { path: "companies/search", element: <SearchCompanies /> },
      { path: "profile", element: <Profile /> },
      { path: "booking-history", element: <BookingHistory /> },
      { path: "contact-us", element: <ContactUs /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={routers} />;
}

export default App;
