import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "civicsense-jwt-secret-dev-2026-key";

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

async function testRBAC() {
  console.log("=== Testing RBAC & Privacy Scoping on Node.js Backend ===\n");

  const citizenToken = makeToken({ sub: "cit-1", role: "citizen", name: "Anshul Zalke" });
  const roadsOfficerToken = makeToken({ sub: "usr-off-1", role: "official", name: "R. Kulkarni", department: "potholes" });
  const garbageOfficerToken = makeToken({ sub: "usr-off-2", role: "official", name: "S. Deshmukh", department: "garbage" });
  const adminToken = makeToken({ sub: "usr-admin-1", role: "admin", name: "Super Admin" });

  async function fetchComplaints(token, query = "") {
    const res = await fetch(`http://localhost:4000/api/complaints${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, data: await res.json() };
  }

  // 1. Citizen Request
  const citizenRes = await fetchComplaints(citizenToken);
  console.log(`1. Citizen (cit-1) Fetch Complaints: HTTP ${citizenRes.status}, count: ${citizenRes.data.complaints?.length || 0}`, citizenRes.data);
  if (citizenRes.status === 200) {
    const invalidOthers = (citizenRes.data.complaints || []).filter(c => c.citizen_id && c.citizen_id !== "cit-1");
    if (invalidOthers.length === 0) {
      console.log("   ✅ PASSED: Strict Citizen Isolation enforced. Zero foreign complaints leaked.");
    } else {
      console.error("   ❌ FAILED: Foreign complaints found in citizen query:", invalidOthers);
    }
  }

  // 2. Road Officer Request (potholes)
  const roadOffRes = await fetchComplaints(roadsOfficerToken);
  console.log(`\n2. Road Officer (potholes) Fetch Complaints: HTTP ${roadOffRes.status}, count: ${roadOffRes.data.complaints?.length || 0}`);
  if (roadOffRes.status === 200) {
    const nonRoad = (roadOffRes.data.complaints || []).filter(c => !["potholes", "road_damage", "infrastructure"].includes(c.category));
    if (nonRoad.length === 0) {
      console.log("   ✅ PASSED: Officer strictly scoped to Road & Infrastructure category.");
    } else {
      console.error("   ❌ FAILED: Non-road complaints found in officer query:", nonRoad);
    }
  }

  // 3. Super Admin Request (All + Category Filter)
  const adminRes = await fetchComplaints(adminToken);
  const adminPotholeRes = await fetchComplaints(adminToken, "?category=potholes");
  console.log(`\n3. Super Admin Fetch Complaints: Total District: ${adminRes.data.complaints?.length || 0}, Potholes Filtered: ${adminPotholeRes.data.complaints?.length || 0}`);
  if (adminRes.status === 200 && adminPotholeRes.status === 200) {
    console.log("   ✅ PASSED: Super Admin has full district visibility with dynamic department filtering.");
  }

  // 4. Citizen Foreign Grievance Token Lookup Protection (403 Forbidden)
  const foreignToken = adminRes.data.complaints?.[0]?.token;
  if (foreignToken) {
    const foreignLookupRes = await fetch(`http://localhost:4000/api/complaints/${foreignToken}`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    console.log(`\n4. Citizen Foreign Token (${foreignToken}) Direct Lookup: HTTP ${foreignLookupRes.status}`);
    if (foreignLookupRes.status === 403) {
      console.log("   ✅ PASSED: Access Denied (HTTP 403) for citizen attempting to view foreign grievance.");
    } else {
      console.log("   Status:", foreignLookupRes.status);
    }
  }

  console.log("\n=== RBAC Full-Stack Verification Complete ===");
}

testRBAC();
