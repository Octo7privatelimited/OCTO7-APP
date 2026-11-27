/* OCTO7 | admin.js - Founder Administration */
const FA = [["Human Resource (HR)"], ["Administration", [["Website Pages", "pubedit"]]],
  ["Accounts & Finance", [["Member Joining Accounts"],
    ["BV Calculation & Matching", [["All Members BV Summary"], ["BV Matching & Expiry", "bvrun"], ["Left BV & Right BV"], ["First Match 2:1 / 1:2"], ["Subsequent Matching 1:1"], ["Matched BV"], ["Unmatched BV"], ["Carry Forward BV"], ["Forfeited BV"], ["Daily Capping"], ["Eligible BV For Commission"]]],
    ["Payment Verification"], ["Bank Transfer Management"], ["Member Wallet"], ["Commission Calculation"], ["Withdrawal Management", "wdm"], ["Child ID to Main ID Transfers"],
    ["Refund Management"], ["Daily Accounts"], ["Financial Reports"], ["Tax & Compliance Accounts"], ["Audit & Reconciliation"]]],
  ["Coupons & Pins Management", [["Coupon & Pin Dashboard", "cpd"], ["Generate Pin & Distribution", "cpg"], ["Coupon & Pin History", "cph"]]],
  ["Sales Department", [["Orders & Delivery", "ords"]]], ["Marketing Department"], ["Member Relations", [["KYC Review", "kycr"]]], ["Network Department"], ["Customer Support"], ["IT & Software"],
  ["Product Management", [["Products", "prodm"]]], ["Purchase & Procurement"], ["Inventory & Warehouse"], ["Logistics & Distribution"], ["Legal & Compliance"], ["Quality Control"], ["Training & Development"]];
const FAI = {"Human Resource (HR)": "briefcase", "Administration": "tool", "Accounts & Finance": "wallet", "Coupons & Pins Management": "ticket", "Sales Department": "trend", "Marketing Department": "megaphone",
  "Member Relations": "smile", "Network Department": "globe", "Customer Support": "headset", "IT & Software": "monitor", "Product Management": "package", "Purchase & Procurement": "clipboard",
  "Inventory & Warehouse": "archive", "Logistics & Distribution": "truck", "Legal & Compliance": "scale", "Quality Control": "search", "Training & Development": "book",
  "BV Calculation & Matching": "chart", "Withdrawal Management": "card", "Member Wallet": "wallet"};
const adm = () => { if (!isAdmin) { go("portal", false); throw new Error("not allowed"); } };
async function mmap(ids) {
  const u = [...new Set(ids)].filter(Boolean); if (!u.length) return {};
  const {data} = await sb.from("members").select("user_id,full_name").in("user_id", u);
  return Object.fromEntries((data || []).map(m => [m.user_id, m]));
}
const mc = (m, id) => m ? `${esc(m.user_id)} ${esc(m.full_name || "")}` : esc(id || "");
const btns = (id, list) => list.map(([a, l]) => `<button class="btn" data-id="${id}" data-a="${a}">${l}</button>`).join("");
function bindAct(reload, run) {
  $("#v").querySelectorAll("[data-a]").forEach(b => b.onclick = () => act(b, async () => {
    if (/reject|cancel/i.test(b.dataset.a) && !confirm("Are you sure?")) return;
    await run(b.dataset.id, b.dataset.a); toast("Updated."); await reload();
  }));
}
async function fa() {
  adm();
  let list = FA; for (const i of faPath) list = list[i][1];
  tiles(list.map(m => [FAI[m[0]] || (Array.isArray(m[1]) ? "folder" : "file"), m[0]]), i => {
    const m = list[i];
    if (Array.isArray(m[1])) { faPath.push(i); render(); }
    else { soonT = m[0]; hist.push("fa"); go(m[1] || "soon", false); }
  });
}

/* ---- coupons and pins ---- */
async function cpd() {
  adm();
  const p = await call(sb.from("coupon_pins").select("*").order("created_at", {ascending: false}).limit(1000));
  const M = await mmap(p.map(x => x.used_by));
  $("#v").innerHTML = `<div class="card"><h2>Pin overview</h2><div class="row"><span>Pins created</span><b>${p.length}</b></div><div class="row"><span>Unused</span><b>${p.filter(x => x.status === "Unused").length}</b></div><div class="row"><span>Used</span><b>${p.filter(x => x.status === "Used").length}</b></div></div>
  <div class="card"><h2>Recently used</h2>${p.filter(x => x.used_by).slice(0, 10).map(x => `<div class="row"><span>${mc(M[x.used_by], x.used_by)}<br><span class="note">${esc(x.pin)}, ${inr(x.value)}</span></span><span class="note">${x.used_at ? day(x.used_at) : ""}</span></div>`).join("") || '<p class="mut">No pin has been used yet.</p>'}</div>`;
}
async function cpg() {
  adm();
  $("#v").innerHTML = `<form id="gf" class="card"><h2>Generate pins</h2>
  <label>Number of pins<input name="n" type="number" min="1" max="100" value="1" inputmode="numeric" required></label>
  <label>Pin value (₹) = first purchase amount<input name="v" type="number" min="1" step="1" inputmode="decimal" required></label>
  <button class="btn">Generate pins</button></form><div id="out"></div>`;
  $("#gf").onsubmit = e => {
    e.preventDefault(); const f = new FormData(e.target);
    act($(".btn"), async () => {
      const pins = await call(sb.rpc("create_coupon_pins", {p_count: +f.get("n"), p_value: +f.get("v")}));
      $("#out").innerHTML = `<div class="card"><h2>New pins (${pins.length})</h2><p class="note">Give each pin to a member. Copy them now.</p>${pins.map(x => `<div class="row"><b>${esc(x)}</b><span class="note">${inr(f.get("v"))}</span></div>`).join("")}</div>`;
      toast("Pins generated.");
    });
  };
}
async function cph() {
  adm();
  const p = await call(sb.from("coupon_pins").select("*").order("created_at", {ascending: false}).limit(200));
  const M = await mmap(p.map(x => x.used_by));
  $("#v").innerHTML = `<div class="card">${p.map(x => `<div class="row"><span><b>${esc(x.pin)}</b><br><span class="note">${inr(x.value)}, ${day(x.created_at)}${x.used_by ? ", used by " + mc(M[x.used_by], x.used_by) : ""}</span></span><span class="tag">${x.status}</span></div>`).join("") || '<p class="mut">No pins have been created yet.</p>'}</div>`;
}

/* ---- withdrawals, orders, KYC ---- */
async function wdm() {
  adm();
  const w = await call(sb.from("withdrawals").select("*").order("created_at", {ascending: false}).limit(100));
  const M = await mmap(w.map(x => x.user_id));
  $("#v").innerHTML = w.map(x => `<div class="card"><div class="row" style="border:0"><span>${mc(M[x.user_id], x.user_id)}<br><span class="note">${day(x.created_at)}, pay ${inr(x.net_amount)} of ${inr(x.amount)}<br>Admin charge ${inr(x.admin_charge)}, TDS ${inr(x.tds)}</span></span><span class="tag">${x.status}</span></div>${x.status === "Pending" ? btns(x.id, [["Paid", "Mark as paid"], ["Rejected", "Reject and refund"]]) : ""}</div>`).join("") || '<p class="mut">No withdrawal requests.</p>';
  bindAct(wdm, (id, a) => call(sb.rpc("process_withdrawal", {p_id: id, p_status: a})));
}
async function ords() {
  adm();
  const o = await call(sb.from("orders").select("*").order("created_at", {ascending: false}).limit(50));
  const M = await mmap(o.map(x => x.user_id));
  $("#v").innerHTML = o.map(x => `<div class="card"><div class="row" style="border:0"><span>${mc(M[x.user_id], x.user_id)}<br><span class="note">${day(x.created_at)}, ${x.kind === "first" ? "first purchase" : "repurchase"}, ${inr(x.net_amount)}</span></span><span class="tag">${STATUS[x.status] || x.status}</span></div>${x.status === "Pending" ? btns(x.id, [["confirm", "Confirm order"], ["cancel", "Cancel order"]]) : ""}</div>`).join("") || '<p class="mut">No orders yet.</p>';
  bindAct(ords, (id, a) => call(sb.rpc(a === "confirm" ? "confirm_order" : "cancel_order", {p_order: id})));
}
async function kycr() {
  adm();
  const k = await call(sb.from("kyc").select("*").order("updated_at", {ascending: false}).limit(30));
  const M = await mmap(k.map(x => x.user_id)), L = {};
  for (const x of k) for (const f of ["passbook", "aadhaar", "pan"]) if (x[f + "_path"]) L[x.user_id + f] = (await sb.storage.from("kyc").createSignedUrl(x[f + "_path"], 600)).data?.signedUrl;
  $("#v").innerHTML = k.map(x => `<div class="card"><div class="row" style="border:0"><span>${mc(M[x.user_id], x.user_id)}<br><span class="note">${esc(x.bank_name || "")} ${esc(x.account_number || "")} ${esc(x.ifsc || "")}<br>PAN ${esc(x.pan || "")}</span></span><span class="tag">${x.status}</span></div>
    <p>${["passbook", "aadhaar", "pan"].map(f => L[x.user_id + f] ? `<a class="link" target="_blank" rel="noopener" href="${esc(L[x.user_id + f])}">${f}</a> ` : "").join("")}</p>
    ${btns(x.user_id, [["Approved", "Approve"], ["Rejected", "Reject"]].filter(([s]) => s !== x.status))}</div>`).join("") || '<p class="mut">No KYC submissions yet.</p>';
  bindAct(kycr, (id, a) => call(sb.rpc("review_kyc", {p_user: id, p_status: a})));
}

/* ---- products, BV, website pages ---- */
async function prodm() {
  adm();
  const p = await call(sb.from("products").select("*").order("created_at", {ascending: false}));
  $("#v").innerHTML = `<form id="pf2" class="card"><h2>Add a product</h2><label>Name<input name="name" required></label><label>Description<input name="description"></label>
    <label>Price (₹)<input name="price" type="number" min="1" step="0.01" required inputmode="decimal"></label><label>BV (business volume)<input name="pv" type="number" min="0" step="0.01" value="0" required inputmode="decimal"></label>
    <button class="btn">Add product</button></form>
  ${p.map(x => `<div class="card"><div class="row" style="border:0"><span><b>${esc(x.name)}</b><br><span class="note">${inr(x.price)}, ${+x.pv} BV</span></span><button class="link" data-id="${x.id}" data-a="${x.active ? 0 : 1}">${x.active ? "Hide" : "Show"}</button></div></div>`).join("")}`;
  $("#pf2").onsubmit = e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    act($(".btn"), async () => { await call(sb.from("products").insert({name: f.name.trim(), description: f.description.trim() || null, price: +f.price, pv: +f.pv})); toast("Product added."); await prodm(); });
  };
  $("#v").querySelectorAll("[data-a]").forEach(b => b.onclick = () => act(b, async () => { await call(sb.from("products").update({active: b.dataset.a === "1"}).eq("id", b.dataset.id)); await prodm(); }));
}
async function bvrun() {
  adm();
  const r = await call(sb.from("binary_runs").select("*").order("created_at", {ascending: false}).limit(30));
  const M = await mmap(r.map(x => x.user_id));
  $("#v").innerHTML = `<div class="card"><h2>BV matching</h2><p class="note">Pair matching, the ₹5,000 daily cap and forfeit happen automatically whenever BV is added. Nothing needs to be run daily.</p></div>
  <div class="card"><h2>12 month FIFO expiry</h2><p class="note">Removes BV older than 12 months for members who have made their first withdrawal. Run it once a day.</p><button class="btn" id="ex">Run FIFO expiry now</button></div>
  <div class="card"><h2>Recent matching</h2>${r.map(x => `<div class="row"><span>${mc(M[x.user_id], x.user_id)}<br><span class="note">${esc(x.run_date)}, ${x.pairs} pair(s)${+x.forfeited_bv ? ", forfeited " + x.forfeited_bv + " BV" : ""}</span></span><b>${inr(x.income)}</b></div>`).join("") || '<p class="mut">No matching yet.</p>'}</div>`;
  $("#ex").onclick = e => act(e.target, async () => { const n = await call(sb.rpc("expire_old_bv")); toast(`Done. ${n} BV entries expired.`); await bvrun(); });
}
async function pubedit() {
  adm();
  const i = (await sb.rpc("public_info")).data || {};
  $("#v").innerHTML = `<form id="pe" class="card"><h2>Pages on the welcome screen</h2><p class="note">Have the wording checked by your legal adviser before you publish it.</p>
    <label>About us<textarea name="about_text">${esc(i.about_text)}</textarea></label><label>Opportunity<textarea name="opportunity_text">${esc(i.opportunity_text)}</textarea></label>
    <label>Contact phone<input name="help_phone" value="${esc(i.help_phone)}"></label><label>Contact email<input name="help_email" type="email" value="${esc(i.help_email)}"></label>
    <label>Contact hours<input name="help_hours" value="${esc(i.help_hours)}"></label><button class="btn">Save</button></form>`;
  $("#pe").onsubmit = e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
    act($(".btn"), async () => { for (const [k, v] of Object.entries(d)) await call(sb.rpc("set_setting", {p_key: k, p_value: v.trim()})); Object.assign(cfg, d); toast("Saved."); });
  };
}
