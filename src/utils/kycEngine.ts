export type KycDocType = "passport" | "id_card" | "drivers_license";
export type KycStatus = "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED";

export interface KycRecord {
  id: string;
  userId: string;
  username: string;
  email: string;
  country: string;
  registrationDate: string;
  docType: KycDocType;
  docFront: string;
  docBack: string | null;
  selfie: string;
  status: KycStatus;
  adminNote: string;
  adminName: string;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface KycSubmissionInput {
  userId: string;
  username: string;
  email: string;
  country: string;
  registrationDate: string;
  docType: KycDocType;
  docFront: string;
  docBack: string | null;
  selfie: string;
}

export interface KycLogEntry {
  id: string;
  recordId: string;
  userId: string;
  action: "SUBMITTED" | "APPROVED" | "REJECTED" | "RESUBMISSION_REQUESTED" | "REJECTED_AND_RESTRICTED";
  adminName: string;
  note: string;
  timestamp: string;
}

const KYC_RECORDS_KEY = "coinloot_kyc_records";
const KYC_PREFIX = "coinloot_kyc_";
const KYC_LOGS_KEY = "coinloot_kyc_logs";

function generateId(): string {
  return `kyc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function getRecords(): KycRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KYC_RECORDS_KEY) || "[]");
  } catch { return []; }
}

function setRecords(records: KycRecord[]) {
  // Strip image data to avoid localStorage size limits — store metadata only
  const stripped = records.map(r => ({
    ...r, docFront: "", docBack: null, selfie: ""
  }));
  try {
    localStorage.setItem(KYC_RECORDS_KEY, JSON.stringify(stripped));
  } catch { /* localStorage full — ignore */ }
}

function getLogs(): KycLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KYC_LOGS_KEY) || "[]");
  } catch { return []; }
}

function setLogs(logs: KycLogEntry[]) {
  try {
    localStorage.setItem(KYC_LOGS_KEY, JSON.stringify(logs));
  } catch {}
}

function addLog(recordId: string, userId: string, action: KycLogEntry["action"], adminName: string, note: string) {
  const logs = getLogs();
  logs.unshift({
    id: generateId(),
    recordId,
    userId,
    action,
    adminName,
    note,
    timestamp: new Date().toISOString(),
  });
  setLogs(logs);
}

export function getKycRecord(userId: string): KycRecord | undefined {
  return getRecords().find(r => r.userId === userId);
}

export function getKycRecordById(recordId: string): KycRecord | undefined {
  return getRecords().find(r => r.id === recordId);
}

export function getKycLogs(userId?: string): KycLogEntry[] {
  const logs = getLogs();
  if (userId) return logs.filter(l => l.userId === userId);
  return logs;
}

export async function submitKyc(input: KycSubmissionInput): Promise<KycRecord> {
  const now = new Date().toISOString();

  const record: KycRecord = {
    id: generateId(),
    userId: input.userId,
    username: input.username,
    email: input.email,
    country: input.country,
    registrationDate: input.registrationDate,
    docType: input.docType,
    docFront: input.docFront,
    docBack: input.docBack || null,
    selfie: input.selfie,
    status: "PENDING",
    adminNote: "",
    adminName: "",
    submittedAt: now,
    reviewedAt: null,
  };

  // Send to server with full image data
  try {
    const resp = await fetch("/api/kyc/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: input.userId,
        username: input.username,
        email: input.email,
        country: input.country,
        registrationDate: input.registrationDate,
        docType: input.docType,
        docFront: input.docFront,
        docBack: input.docBack || null,
        selfie: input.selfie,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.record?.id) {
        record.id = data.record.id;
      }
    }
  } catch {
    // Server unavailable — images may be lost on refresh but submission still recorded locally
  }

  // Store metadata locally (images stripped to avoid localStorage quota issues)
  const records = getRecords();
  const existing = records.findIndex(r => r.userId === input.userId);
  if (existing >= 0) {
    records[existing] = { ...record, docFront: "", docBack: null, selfie: "" };
  } else {
    records.push({ ...record, docFront: "", docBack: null, selfie: "" });
  }
  setRecords(records);

  try { updateUserKycStatus(input.userId, "PENDING"); } catch {}
  try { addLog(record.id, input.userId, "SUBMITTED", input.username, "KYC documents submitted"); } catch {}
  try {
    const { createAdminNotification } = await import("./adminNotifier");
    createAdminNotification("verification_request", "🪪 KYC Submitted", `User: ${input.username}\nType: ${input.docType}\nCountry: ${input.country}`, input.userId, input.username, { related_id: record.id, docType: input.docType });
  } catch {}

  return record;
}

export function approveKycByUserId(userId: string, adminName: string): boolean {
  const now = new Date().toISOString();
  const records = getRecords();
  let record = records.find(r => r.userId === userId);

  // If record not in localStorage, create a stub so the update doesn't silently fail
  if (!record) {
    const newRecord: KycRecord = {
      id: `kyc-auto-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      userId,
      username: "",
      email: "",
      country: "",
      registrationDate: "",
      docType: "id_card",
      docFront: "",
      docBack: null,
      selfie: "",
      status: "APPROVED",
      adminNote: "",
      adminName: adminName,
      submittedAt: now,
      reviewedAt: now,
    };
    records.push(newRecord);
    record = newRecord;
  } else {
    record.status = "APPROVED";
    record.adminName = adminName;
    record.reviewedAt = now;
  }
  setRecords(records);

  updateUserKycStatus(userId, "APPROVED");
  addLog(record.id, userId, "APPROVED", adminName, "KYC approved");

  fetch("/api/kyc/approve", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, adminName }),
  }).catch(() => {});

  return true;
}

export function rejectKycByUserId(userId: string, adminName: string, note: string): boolean {
  const now = new Date().toISOString();
  const records = getRecords();
  let record = records.find(r => r.userId === userId);

  if (!record) {
    const newRecord: KycRecord = {
      id: `kyc-auto-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      userId,
      username: "",
      email: "",
      country: "",
      registrationDate: "",
      docType: "id_card",
      docFront: "",
      docBack: null,
      selfie: "",
      status: "REJECTED",
      adminNote: note,
      adminName: adminName,
      submittedAt: now,
      reviewedAt: now,
    };
    records.push(newRecord);
    record = newRecord;
  } else {
    record.status = "REJECTED";
    record.adminName = adminName;
    record.adminNote = note;
    record.reviewedAt = now;
  }
  setRecords(records);

  updateUserKycStatus(userId, "REJECTED");
  addLog(record.id, userId, "REJECTED", adminName, note || "KYC rejected");

  fetch("/api/kyc/reject", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, adminName, reason: note, restrictAccount: false }),
  }).catch(() => {});

  return true;
}

export function rejectAndRestrictKyc(userId: string, adminName: string, note: string) {
  const records = getRecords();
  const record = records.find(r => r.userId === userId);
  if (!record) return;

  record.status = "REJECTED";
  record.adminName = adminName;
  record.adminNote = note;
  record.reviewedAt = new Date().toISOString();
  setRecords(records);

  updateUserKycStatus(userId, "REJECTED");
  addLog(record.id, userId, "REJECTED_AND_RESTRICTED", adminName, (note || "KYC rejected") + " — Account restricted");

  fetch("/api/kyc/reject", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, adminName, reason: note, restrictAccount: true }),
  }).catch(() => {});
}

export function requestResubmission(recordId: string, adminName: string) {
  const records = getRecords();
  const record = records.find(r => r.id === recordId);
  if (!record) return;

  record.status = "REJECTED";
  record.adminName = adminName;
  record.adminNote = "Resubmission requested. Please upload new documents.";
  record.reviewedAt = new Date().toISOString();
  setRecords(records);

  updateUserKycStatus(record.userId, "REJECTED");
  addLog(record.id, record.userId, "RESUBMISSION_REQUESTED", adminName, "Resubmission requested");
}

function updateUserKycStatus(userId: string, status: KycStatus) {
  try {
    const accounts = JSON.parse(localStorage.getItem("coinloot_accounts") || "[]");
    const acctIdx = accounts.findIndex((a: any) => a.profile?.id === userId);
    if (acctIdx >= 0) {
      accounts[acctIdx].profile.kyc_status = status;
      localStorage.setItem("coinloot_accounts", JSON.stringify(accounts));
    }
  } catch {}

  try {
    const profiles = JSON.parse(localStorage.getItem("coinloot_user_profiles") || "[]");
    const pIdx = profiles.findIndex((p: any) => p.id === userId);
    if (pIdx >= 0) {
      profiles[pIdx].kyc_status = status;
      localStorage.setItem("coinloot_user_profiles", JSON.stringify(profiles));
    }
  } catch {}

  import("../lib/supabaseService").then(({ updateKycStatus }) => {
    try { updateKycStatus(userId, status, userId); } catch {}
  }).catch(() => {});

  import("../lib/supabase").then(({ getSupabaseClient }) => {
    try { getSupabaseClient?.()?.from("profiles")?.update({ kyc_status: status }).eq("id", userId); } catch {}
  }).catch(() => {});

  try {
    window.dispatchEvent(new CustomEvent("kyc-status-changed", { detail: { userId, status } }));
  } catch {}
}

export function getKycStats() {
  const records = getRecords();
  return {
    total: records.length,
    pending: records.filter(r => r.status === "PENDING").length,
    approved: records.filter(r => r.status === "APPROVED").length,
    rejected: records.filter(r => r.status === "REJECTED").length,
  };
}

export function getAllKycRecords(): KycRecord[] {
  return getRecords();
}

export function getPendingKycRecords(): KycRecord[] {
  return getRecords().filter(r => r.status === "PENDING");
}

export function deleteKycRecord(userId: string) {
  const records = getRecords().filter(r => r.userId !== userId);
  setRecords(records);
  localStorage.removeItem(`${KYC_PREFIX}${userId}`);
}

export async function fetchAllKycRecordsFromServer(): Promise<KycRecord[]> {
  try {
    const resp = await fetch("/api/kyc/records-admin");
    if (resp.ok) {
      const data = await resp.json();
      const records: KycRecord[] = data.records || [];
      // Sync metadata to localStorage for offline fallback
      const stripped = records.map(r => ({ ...r, docFront: "", docBack: null, selfie: "" }));
      try {
        localStorage.setItem(KYC_RECORDS_KEY, JSON.stringify(stripped));
      } catch {}
      return records;
    }
  } catch {}
  return getRecords();
}
