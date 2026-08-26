import React from "react";
import GovQueue from "./GovQueue";
import ErrorBoundary from "../../components/ErrorBoundary";
import { useApp } from "../../context/AppContext";

export default function GovDashboard(props) {
  const authState = useApp();

  // Comprehensive Defensive Null-Checking
  const user = props?.user || authState?.user || {};
  const emailStr = String(user?.email || "").toLowerCase();
  const rawDept = String(
    props?.userDept ||
    user?.department ||
    user?.dept ||
    (emailStr.includes("deshmukh") ? "garbage" : emailStr.includes("bhosale") ? "drainage" : "potholes")
  ).toLowerCase();
  const userDept = rawDept;
  const userRole = props?.userRole || user?.role || authState?.role || "L1";

  const complaints = props?.complaints ?? authState?.complaints ?? [];
  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  return (
    <ErrorBoundary title="Government Priority Queue Error">
      <GovQueue
        {...props}
        user={user}
        userDept={userDept}
        rawDept={rawDept}
        userRole={userRole}
        complaints={safeComplaints}
      />
    </ErrorBoundary>
  );
}

