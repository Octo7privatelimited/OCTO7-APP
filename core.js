/* OCTO7 | core.js - connection, helpers, shared state */
const SB_URL = "https://xqckhmrzdzhsdronrbow.supabase.co", SB_KEY = "sb_publishable_kvOcNoJlS_YTk0vf8N4HBg_WWrWLsGp";
const sb = supabase.createClient(SB_URL, SB_KEY);
const $ = (s, r = document) => r.querySelector(s);
const app = $("#app");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const inr = n => "₹" + Number(n || 0).toLocaleString("en-IN", {maximumFractionDigits: 2});
const idRest = v => String(v || "").trim().toUpperCase().replace(/^OCTO7/, "");
const fullId = v => idRest(v) ? "OCTO7" + idRest(v) : "";
const idHtml = c => esc(c);
const idStack = c => { c = String(c || ""); return c.startsWith("OCTO7") ? `<span class="idl">OCTO7<br>${esc(c.slice(5))}</span>` : esc(c); };
const idField = (n, l, req = true, val = "") => `<label>${l}<div class="idf"><span>OCTO7</span><input name="${n}" value="${esc(val)}"${req ? " required" : ""} autocapitalize="characters" autocomplete="off"></div></label>`;
const pwf = (n, l, ac, min = 6) => `<label>${l}<div class="pw"><input name="${n}" type="password" minlength="${min}" required autocomplete="${ac}"><button type="button" class="eye" aria-label="Show">👁️</button></div></label>`;
document.addEventListener("click", e => {
  const b = e.target.closest(".eye"); if (!b) return;
  const i = b.previousElementSibling, hide = i.type === "password";
  i.type = hide ? "text" : "password"; b.textContent = hide ? "🙈" : "👁️"; b.setAttribute("aria-label", hide ? "Hide" : "Show");
});
const day = d => new Date(d).toLocaleDateString("en-IN", {day: "numeric", month: "short"});

/* shared state */
let me = null, cfg = {}, cart = {};
let treeRoot = null, regPre = null, faPath = [], page = "portal", hist = [], isAdmin = false, authUser = null, soonT = "";

function toast(msg, bad) {
  const t = $("#toast");
  t.textContent = msg; t.className = "show" + (bad ? " bad" : "");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.className = "", 3800);
}
async function call(p) {
  const {data, error} = await p;
  if (error) { toast(error.message, true); throw error; }
  return data;
}
async function act(btn, fn) {
  btn.disabled = true;
  try { await fn(); } catch (e) {} finally { btn.disabled = false; }
}

/* the logged-in member, joined from members + member_profiles */
async function fetchMe(user) {
  const {data: m} = await sb.from("members").select("*").eq("auth_uid", user.id).maybeSingle();
  if (!m) return null;
  const {data: p} = await sb.from("member_profiles").select("*").eq("user_id", m.user_id).maybeSingle();
  const st = m.status !== "Active" ? m.status.toLowerCase() : (m.is_activated ? "active" : "pending");
  return {...(p || {}), ...m, id: user.id, member_code: m.user_id, status: st};
}
async function loadSettings() {
  const s = await sb.from("app_settings").select("key,value");
  cfg = Object.fromEntries((s.data || []).map(r => [r.key, r.value]));
}
const RANKS = ["No rank", "Bronze", "Silver", "Gold", "Platinum", "Sapphire", "Emerald", "Diamond"];
const STATUS = {Pending: "Waiting for confirmation", Confirmed: "Confirmed", Cancelled: "Cancelled"};
const KIND = {binary_income: "Binary income", commission_first_purchase: "First purchase income", commission_repurchase: "Repurchase income",
  withdrawal: "Withdrawal", withdrawal_refund: "Withdrawal refund", transfer_in: "Transfer in", transfer_out: "Transfer out"};
