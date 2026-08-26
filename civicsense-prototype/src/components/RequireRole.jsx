import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function RequireRole({ role, children }) {
  const authState = useApp();
  const currentRole = authState?.role || authState?.user?.role;

  // Normalize role aliases ('official' <=> 'gov')
  const isGovMatch = (role === "gov" || role === "official") && (currentRole === "gov" || currentRole === "official");
  const isDirectMatch = currentRole === role;

  if (!isDirectMatch && !isGovMatch) {
    const redirectRole = role === "official" ? "gov" : role;
    return <Navigate to={`/login/${redirectRole}`} replace />;
  }
  return children;
}

