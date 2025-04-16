// Pages/Layout/Routes.js

import Login from "../Auth/login";
import NotFound from "./NotFound";
import RegistrationPage from "../Auth/Register";
import HomeComponent from "../Home/home";
import Layout from "../BusesList/BuesLayout";
import BusesList from "../BusesList/BusesList";
import PassengerFormWrapper from "../Booking/BookingForm";
import PaymentForm from "../Payment/Payment";
import ForgotPassword from "../Auth/ForgotPassword";


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
    },
    {
        path : "/forgotPassword",
        element: <ForgotPassword />
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
        path: "/passenger-form",
        element: <PassengerFormWrapper />
    },
    {
        path: '/payment',
        element: <PaymentForm />
    }
];

const Routes = {
    DefaultRoutes,
    PrivateRoutes
};

export default Routes;
