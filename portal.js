/* OCTO7 | portal.js - navigation, menu, home, dashboard, small pages */
const NAV = [["portal", "Home"], ["shop", "Shop"], ["wallet", "Wallet"], ["profile", "Profile"]];
const MENU = [["grid", "Home", "portal"], ["shield", "Founder Administration", "fa", 1], ["grid", "Dashboard", "dash"], ["user", "My Profile", "profile"],
  ["share", "Genealogy", "tree"], ["userplus", "New Member Registration", "newreg"], ["package", "Products & Catalog", "shop"], ["cart", "My Purchases / Orders", "orders"],
  ["wallet", "Wallet & Withdrawals", "wallet"], ["bank", "Bank Details & KYC", "bank"], ["ticket", "My Coupons & Pins", "coupons"], ["users", "Team Members", "tree"],
  ["headset", "Help Line & Support", "help"], ["bell", "Notifications", "notes"], ["key", "Change Password", "password"], ["logout", "Logout", "logout"]];
const HIDE = ["Home", "My Profile", "Products & Catalog", "Wallet & Withdrawals"];

function go(p, push = true) { if (push && page !== p) hist.push(page); page = p; render(); window.scrollTo(0, 0); }
function faTitle() { let l = FA, t = "Founder Administration"; for (const i of faPath) { t = l[i][0]; l = l[i][1]; } return t; }
function render() {
  const P = PAGES[page], T = page === "fa" ? faTitle() : page === "soon" ? soonT : P.t;
  app.innerHTML = `<div class="tb">${page === "portal" ? '<b>Member Portal</b><button class="menu" id="mn">☰ Menu</button>' : `<button class="bk" id="bk" aria-label="Back">←</button><b>${esc(T)}</b>`}</div>
  <main id="v"><p class="mut">Loading…</p></main>
  <nav>${NAV.map(([k, l]) => `<button data-p="${k}" class="${k === page ? "on" : ""}">${l}</button>`).join("")}</nav>`;
  if ($("#mn")) $("#mn").onclick = () => go("menu");
  if ($("#bk")) $("#bk").onclick = () => { if (page === "fa" && faPath.length) { faPath.pop(); render(); } else go(hist.pop() || "portal", false); };
  app.querySelectorAll("nav button").forEach(b => b.onclick = () => { hist = b.dataset.p === "portal" ? [] : ["portal"]; go(b.dataset.p, false); });
  Promise.resolve().then(() => P.f()).catch(() => {});
}
async function portal() {
  $("#v").innerHTML = `<div class="pt"><img class="plogo" src="globe.webp" alt="" onerror="this.remove()"><h1 class="nm"><span class="wl">Welcome</span><br>${esc(me.full_name || "Member")}</h1>${me.full_name ? "" : '<p class="note">Add your name in My Profile.</p>'}</div>`;
}
const ICO = {
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  grid: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  userplus: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  bank: '<path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-7 10 7z"/>',
  ticket: '<path d="M3 9a3 3 0 0 1 0 6v3h18v-3a3 3 0 0 1 0-6V6H3z"/><path d="M13 6v2M13 11v2M13 16v2"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  headset: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M17 6l3 3M14 9l2 2"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  wallet: '<path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
  trend: '<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
  megaphone: '<path d="M11 5L6 9H2v6h4l5 4zM19 5a10 10 0 0 1 0 14M15.5 8.5a5 5 0 0 1 0 7"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  package: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7zM3.3 7L12 12l8.7-5M12 22V12"/>',
  clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  archive: '<path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/>',
  truck: '<rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  scale: '<path d="M12 3v18M5 7h14M5 7l-3 8a3 3 0 0 0 6 0zM19 7l-3 8a3 3 0 0 0 6 0z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  card: '<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>'};
const ic = n => `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n] || ICO.file}</svg>`;
function tiles(items, click) {
  $("#v").innerHTML = `<div class="grid">${items.map(([n, l], i) => `<button class="tile" data-i="${i}"><span>${ic(n)}</span>${esc(l)}</button>`).join("")}</div>`;
  $("#v").querySelectorAll(".tile").forEach(b => b.onclick = () => click(+b.dataset.i));
}
async function menu() {
  const items = MENU.filter(m => (!m[3] || isAdmin) && !HIDE.includes(m[1]));
  tiles(items.map(m => [m[0], m[1]]), i => {
    const m = items[i];
    if (m[2] === "logout") return logout();
    soonT = m[1]; if (m[2] === "fa") faPath = []; go(m[2]);
  });
}
async function soon() { $("#v").innerHTML = `<div class="card"><h2>${esc(soonT)}</h2><p class="mut">This section is being built and will be added in the next update.</p></div>`; }

async function orders() {
  const o = await call(sb.from("orders").select("*").eq("user_id", me.member_code).order("created_at", {ascending: false}).limit(30));
  $("#v").innerHTML = `<div class="card">${o.map(x => `<div class="row"><span>${day(x.created_at)}</span><span class="tag">${STATUS[x.status] || x.status}</span><b>${inr(x.net_amount)}</b></div>`).join("") || '<p class="mut">You have not placed an order yet.</p>'}</div>`;
}
async function payouts() {
  const [d, t] = await Promise.all([
    sb.from("withdrawals").select("*").eq("user_id", me.member_code).order("created_at", {ascending: false}).limit(20),
    sb.from("wallet_ledger").select("*").eq("user_id", me.member_code).order("created_at", {ascending: false}).limit(50)]);
  $("#v").innerHTML = `<div class="card"><h2>Withdrawal requests</h2>${(d.data || []).map(x => `<div class="row"><span>${day(x.created_at)}<br><span class="note">You receive ${inr(x.net_amount)}</span></span><span class="tag">${esc(x.status)}</span><b>${inr(x.amount)}</b></div>`).join("") || '<p class="mut">No withdrawal requests yet.</p>'}</div>
  <div class="card"><h2>Transactions</h2>${(t.data || []).map(x => `<div class="row"><span>${esc(KIND[x.type] || x.type)}<br><span class="note">${day(x.created_at)}</span></span><span class="${x.amount < 0 ? "neg" : "pos"}">${x.amount < 0 ? "−" : "+"}${inr(Math.abs(x.amount))}</span></div>`).join("") || '<p class="mut">Your earnings and withdrawals will be listed here.</p>'}</div>`;
}
async function notes() {
  const n = await call(sb.from("notifications").select("*").or(`user_id.eq.${me.member_code},user_id.is.null`).order("created_at", {ascending: false}).limit(50));
  $("#v").innerHTML = `<div class="card">${n.map(x => `<div class="row"><div><b>${esc(x.title)}</b><br><span class="note">${esc(x.body)}</span></div><span class="note">${day(x.created_at)}</span></div>`).join("") || '<p class="mut">Nothing new yet.</p>'}</div>`;
}
async function coupons() {
  const c = await call(sb.from("member_coupons").select("*").eq("user_id", me.member_code).order("used_at", {ascending: false}).limit(100));
  $("#v").innerHTML = `<div class="card">${c.map(x => `<div class="row"><span><b>${esc(x.pin)}</b><br><span class="note">${inr(x.value)}, ${day(x.used_at)}</span></span><span class="tag">Used</span></div>`).join("") || '<p class="mut">Pins you have used appear here.</p>'}</div>`;
}
function help() {
  const ph = cfg.help_phone, em = cfg.help_email, hr = cfg.help_hours;
  $("#v").innerHTML = `<div class="card"><h2>We are here to help</h2>${ph ? `<div class="row"><span>Phone</span><a class="link" href="tel:${esc(ph)}">${esc(ph)}</a></div>` : ""}${em ? `<div class="row"><span>Email</span><a class="link" href="mailto:${esc(em)}">${esc(em)}</a></div>` : ""}${hr ? `<div class="row"><span>Hours</span><b>${esc(hr)}</b></div>` : ""}${ph || em || hr ? "" : '<p class="mut">The company will add its help line details here.</p>'}</div>
  ${isAdmin ? `<form id="hf" class="card"><h2>Help line details (founder only)</h2><label>Phone<input name="help_phone" value="${esc(ph)}"></label><label>Email<input name="help_email" type="email" value="${esc(em)}"></label><label>Hours<input name="help_hours" value="${esc(hr)}"></label><button class="btn">Save</button></form>` : ""}`;
  if (isAdmin) $("#hf").onsubmit = e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
    act($(".btn"), async () => { for (const [k, v] of Object.entries(d)) await call(sb.rpc("set_setting", {p_key: k, p_value: v.trim()})); Object.assign(cfg, d); toast("Saved."); help(); });
  };
}
function password() {
  $("#v").innerHTML = `<form id="pw" class="card">${pwf("p", "New password", "new-password")}${pwf("p2", "Confirm password", "new-password")}<button class="btn">Update password</button></form>`;
  $("#pw").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    if (f.get("p") !== f.get("p2")) { toast("The two passwords do not match.", true); return; }
    act($(".btn"), async () => { await call(sb.auth.updateUser({password: f.get("p")})); e.target.reset(); toast("Password updated."); });
  };
}
async function home() {
  const [w, b, n, dc] = await Promise.all([
    sb.from("members").select("wallet_balance,rank_level").eq("user_id", me.member_code).maybeSingle(),
    sb.from("binary_state").select("*").eq("user_id", me.member_code).maybeSingle(),
    sb.from("notifications").select("*").or(`user_id.eq.${me.member_code},user_id.is.null`).order("created_at", {ascending: false}).limit(5),
    sb.rpc("my_direct_count")]);
  const L = +(b.data?.left_bv || 0), R = +(b.data?.right_bv || 0);
  $("#v").innerHTML = `<section class="hero"><p>Wallet balance</p><div class="bal">${inr(w.data?.wallet_balance)}</div></section>
  <section class="card"><h2>Your two legs</h2>
    <div class="bar"><i style="flex:${L || 0.0001}"></i><i class="r" style="flex:${R || 0.0001}"></i></div>
    <div class="lr"><span>Left ${L} BV</span><span>Right ${R} BV</span></div>
    <p class="note">BV that is not matched yet stays here until the other leg catches up.</p></section>
  <section class="card"><h2>My business</h2>
    <div class="row"><span>Direct associates</span><b>${dc.data ?? 0}</b></div>
    <div class="row"><span>Rank</span><b>${esc(RANKS[w.data?.rank_level || 0])}</b></div></section>
  <section class="card"><h2>Notifications</h2>${(n.data || []).map(x => `<div class="row"><div><b>${esc(x.title)}</b><br><span class="note">${esc(x.body)}</span></div><span class="note">${day(x.created_at)}</span></div>`).join("") || '<p class="mut">Nothing new. Updates about orders, pins and payouts appear here.</p>'}</section>`;
}
