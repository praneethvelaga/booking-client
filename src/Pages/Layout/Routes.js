// Pages/Layout/Routes.js

import Login from "../Auth/login";
import NotFound from "./NotFound";
import RegistrationPage from "../Auth/Register";
import HomeComponent from "../Home/home";
import Layout from "../BusesList/BuesLayout";
import BusesList from "../BusesList/BusesList";
import PassengerFormWrapper from "../Booking/BookingForm";


const DefaultRoutes = [
    {
        path: "/",
        element: <Login />
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <RegistrationPage />
    }
];

// Making PrivateRoutes an array
const PrivateRoutes = [
    {
        path: "/homepage",
        element: <HomeComponent />
    },
    {
        path: "/buses-list",
        element: <BusesList />
    },
    {
        path: "/view-seats",
        element: <Layout />
    },
    {
        path:"/seat-layout",
        element:<Layout />
    },
    {
        path: "/passenger-form",
        element: <PassengerFormWrapper />
    }
];

const Routes = {
    DefaultRoutes,
    PrivateRoutes
};

export default Routes;
