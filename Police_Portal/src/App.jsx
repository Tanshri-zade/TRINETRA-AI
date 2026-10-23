import React from "react";
import {
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import History from "./pages/History.jsx";
import Details from "./pages/Details.jsx";

function Guard({ children }) {
    const loggedIn =
        localStorage.getItem("policeLoggedIn") === "true";

    return loggedIn
        ? children
        : <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <Routes>

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />

            <Route
                path="/dashboard"
                element={
                    <Guard>
                        <Dashboard />
                    </Guard>
                }
            />

            <Route
                path="/history"
                element={
                    <Guard>
                        <History />
                    </Guard>
                }
            />

            <Route
                path="/alerts/:id"
                element={
                    <Guard>
                        <Details />
                    </Guard>
                }
            />

            <Route
                path="/alert-details/:id"
                element={
                    <Guard>
                        <Details />
                    </Guard>
                }
            />

            <Route
                path="/alert-details"
                element={
                    <Guard>
                        <Details />
                    </Guard>
                }
            />

            <Route
                path="/"
                element={
                    <Navigate
                        to={
                            localStorage.getItem("policeLoggedIn") === "true"
                                ? "/dashboard"
                                : "/login"
                        }
                        replace
                    />
                }
            />

            <Route
                path="*"
                element={
                    <Navigate
                        to={
                            localStorage.getItem("policeLoggedIn") === "true"
                                ? "/dashboard"
                                : "/login"
                        }
                        replace
                    />
                }
            />

        </Routes>
    );
}