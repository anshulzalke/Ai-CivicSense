const API_BASE = import.meta.env.VITE_API_URL || "/api";
const SERVER_BASE = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

const TOKEN_KEY = "civicsense_jwt_token";
const USER_KEY = "civicsense_user";
const ROLE_KEY = "civicsense_role";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function getStoredRole() {
  return localStorage.getItem(ROLE_KEY) || null;
}

export function setStoredRole(role) {
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  } else {
    localStorage.removeItem(ROLE_KEY);
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith("data:") || imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `${SERVER_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

export function normalizeComplaint(c) {
  if (!c) return null;
  return {
    ...c,
    token: c.token,
    category: c.category,
    title: c.title,
    description: c.description || "",
    severity: Number(c.severity) || 1,
    lat: Number(c.lat) || 0,
    lng: Number(c.lng) || 0,
    status: c.status || "submitted",
    citizenId: c.citizen_id || c.citizenId || "",
    citizen_id: c.citizen_id || c.citizenId || "",
    assignedOfficerId: c.assigned_officer_id || c.assignedOfficerId || null,
    assigned_officer_id: c.assigned_officer_id || c.assignedOfficerId || null,
    escalationLevel: c.escalation_level ?? c.escalationLevel ?? 0,
    escalation_level: c.escalation_level ?? c.escalationLevel ?? 0,
    resolutionNote: c.resolution_note || c.resolutionNote || null,
    resolution_note: c.resolution_note || c.resolutionNote || null,
    citizenSatisfied: c.citizen_satisfied ?? c.citizenSatisfied ?? null,
    citizen_satisfied: c.citizen_satisfied ?? c.citizenSatisfied ?? null,
    createdAt: c.created_at || c.createdAt || new Date().toISOString(),
    created_at: c.created_at || c.createdAt || new Date().toISOString(),
    lastActionAt: c.last_action_at || c.lastActionAt || new Date().toISOString(),
    last_action_at: c.last_action_at || c.lastActionAt || new Date().toISOString(),
    imageUrl: c.image_url || c.imageUrl || c.image || null,
    image_url: c.image_url || c.imageUrl || c.image || null,
    image: c.image_url || c.imageUrl || c.image || null,
    resolutionImageUrl: c.resolution_image_url || c.resolutionImageUrl || c.resolutionImage || null,
    resolution_image_url: c.resolution_image_url || c.resolutionImageUrl || c.resolutionImage || null,
    rating: c.rating ?? null,
    citizenFeedback: c.citizen_feedback || c.citizenFeedback || null,
    citizen_feedback: c.citizen_feedback || c.citizenFeedback || null,
    reopenedReason: c.reopened_reason || c.reopenedReason || null,
    reopened_reason: c.reopened_reason || c.reopenedReason || null,
    flaggedBy: c.flagged_by || c.flaggedBy || null,
    flagged_by: c.flagged_by || c.flaggedBy || null,
    effectiveStatus: c.effectiveStatus || c.status || "submitted",
    effectiveLevel: c.effectiveLevel ?? c.escalation_level ?? c.escalationLevel ?? 0,
    hoursSinceAction: c.hoursSinceAction ?? 0,
    priorityScore: c.priorityScore ?? 0,
  };
}



export function normalizeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    role: u.role,
    name: u.name,
    govId: u.gov_id || u.govId || null,
    email: u.email || null,
    ward: u.ward || null,
    coins: Number(u.coins) || 0,
    flagged: !!u.flagged,
    flagReason: u.flag_reason || u.flagReason || null,
    flag_reason: u.flag_reason || u.flagReason || null,
  };
}

export function normalizeOfficial(o) {
  if (!o) return null;
  return {
    id: o.id,
    name: o.name,
    email: o.email,
    dept: o.department || o.dept,
    department: o.department || o.dept,
    level: Number(o.level) || 1,
  };
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If body is not FormData, default to application/json
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err) {
    throw new Error(
      `Cannot connect to CivicSense backend at ${url}. Please make sure the server is running. (${err.message})`
    );
  }

  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = data?.error || (typeof data === "string" ? data : `HTTP ${res.status}: ${res.statusText}`);
    const error = new Error(errorMsg);
    error.status = res.status;
    error.data = data;

    if (res.status === 401 && !path.includes("/auth/")) {
      clearSession();
    }
    throw error;
  }

  return data;
}

// Convert base64 data URL to Blob
export function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export const api = {
  auth: {
    async citizenLogin({ govId, name, ward }) {
      const data = await request("/auth/citizen-login", {
        method: "POST",
        body: JSON.stringify({ govId, name, ward }),
      });
      if (data.token) setToken(data.token);
      if (data.user) {
        const user = normalizeUser(data.user);
        setStoredUser(user);
        setStoredRole("citizen");
        return { token: data.token, user };
      }
      return data;
    },

    async staffLogin({ email, password }) {
      const data = await request("/auth/staff-login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.token) setToken(data.token);
      if (data.user) {
        const user = normalizeUser(data.user);
        const role = user.role === "official" ? "gov" : user.role;
        setStoredUser(user);
        setStoredRole(role);
        return { token: data.token, user, officialId: data.officialId, role };
      }
      return data;
    },

    async getMe() {
      const data = await request("/auth/me");
      if (data.user) {
        const user = normalizeUser(data.user);
        setStoredUser(user);
        return user;
      }
      return null;
    },

    logout() {
      clearSession();
    },
  },

  complaints: {
    async list(params = {}) {
      const query = new URLSearchParams();
      if (params.category && params.category !== "all") query.append("category", params.category);
      if (params.status && params.status !== "all") query.append("status", params.status);
      const qs = query.toString() ? `?${query.toString()}` : "";

      const data = await request(`/complaints${qs}`);
      const list = (data.complaints || []).map(normalizeComplaint);
      return list;
    },

    async get(token) {
      const data = await request(`/complaints/${encodeURIComponent(token)}`);
      return normalizeComplaint(data.complaint);
    },

    async checkDuplicate({ category, lat, lng }) {
      const data = await request("/complaints/check-duplicate", {
        method: "POST",
        body: JSON.stringify({ category, lat: Number(lat), lng: Number(lng) }),
      });
      return data.duplicate ? normalizeComplaint(data.duplicate) : null;
    },

    async file(draft) {
      let body;
      if (draft instanceof FormData) {
        body = draft;
      } else {
        const fd = new FormData();
        fd.append("category", draft.category);
        fd.append("title", draft.title || `${draft.category} issue`);
        if (draft.description) fd.append("description", draft.description);
        fd.append("severity", String(draft.severity || 3));
        fd.append("lat", String(draft.lat));
        fd.append("lng", String(draft.lng));

        if (draft.image) {
          if (typeof draft.image === "string" && draft.image.startsWith("data:")) {
            const blob = dataURLtoBlob(draft.image);
            fd.append("image", blob, `evidence-${Date.now()}.jpg`);
          } else if (draft.image instanceof Blob || draft.image instanceof File) {
            fd.append("image", draft.image, "evidence.jpg");
          }
        }
        body = fd;
      }

      const data = await request("/complaints", {
        method: "POST",
        body,
      });
      return normalizeComplaint(data.complaint);
    },

    async assign(token, officerId) {
      const data = await request(`/complaints/${encodeURIComponent(token)}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ officerId }),
      });
      return normalizeComplaint(data.complaint);
    },

    async resolve(token, note, resolutionImage = null) {
      let body;
      if (resolutionImage instanceof File || resolutionImage instanceof Blob) {
        const fd = new FormData();
        fd.append("note", note || "Issue addressed by municipal field team.");
        fd.append("resolution_image", resolutionImage, "resolution.jpg");
        body = fd;
      } else if (typeof resolutionImage === "string" && resolutionImage.startsWith("data:")) {
        const blob = dataURLtoBlob(resolutionImage);
        const fd = new FormData();
        fd.append("note", note || "Issue addressed by municipal field team.");
        fd.append("resolution_image", blob, "resolution.jpg");
        body = fd;
      } else {
        body = JSON.stringify({
          note: note || "Issue addressed by municipal field team.",
          resolution_image_url: resolutionImage,
        });
      }

      const data = await request(`/complaints/${encodeURIComponent(token)}/resolve`, {
        method: "PATCH",
        body,
      });
      return normalizeComplaint(data.complaint);
    },


    async validate(token, payload) {
      let bodyData;
      if (typeof payload === "boolean") {
        bodyData = { satisfied: payload };
      } else if (payload && typeof payload === "object") {
        bodyData = payload;
      } else {
        bodyData = { satisfied: Boolean(payload) };
      }

      const data = await request(`/complaints/${encodeURIComponent(token)}/validate`, {
        method: "POST",
        body: JSON.stringify(bodyData),
      });
      return normalizeComplaint(data.complaint);
    },

    async flag(token, reason) {
      const data = await request(`/complaints/${encodeURIComponent(token)}/flag`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || "Resolution flagged by admin" }),
      });
      return normalizeComplaint(data.complaint);
    },
  },


  admin: {
    async getDepartments() {
      const data = await request("/admin/departments");
      return data.departments || [];
    },

    async getOfficials() {
      const data = await request("/admin/officials");
      return (data.officials || []).map(normalizeOfficial);
    },

    async getCitizens() {
      const data = await request("/admin/citizens");
      return (data.citizens || []).map(normalizeUser);
    },

    async flagCitizen(id, { flagged, reason }) {
      const data = await request(`/admin/citizens/${encodeURIComponent(id)}/flag`, {
        method: "PATCH",
        body: JSON.stringify({ flagged, reason }),
      });
      return normalizeUser(data.citizen);
    },

    async getGovPerformance() {
      const data = await request("/admin/gov-performance");
      return data.officials || [];
    },

    async getAuditLog() {
      const data = await request("/admin/audit-log");
      return data.log || [];
    },

    async getSystemHealth() {
      const data = await request("/admin/system-health");
      return data;
    },

    async getSystemDiagnostics() {
      const data = await request("/system/diagnostics");
      return data;
    },


    async seedDemoData() {
      const data = await request("/admin/seed-demo-data", {
        method: "POST",
      });
      return data;
    },

    async resetDatabase() {
      const data = await request("/admin/reset-database", {
        method: "POST",
      });
      return data;
    },
  },
};

