/* OCTO7 | profile.js - profile, photo, bank details and KYC */
const val = x => x || "Not provided";
const fld = (l, x, c = "") => `<div class="card f"><span class="note">${l}</span><b class="${c}">${esc(val(x))}</b></div>`;
const fldH = (l, h, c = "") => `<div class="card f"><span class="note">${l}</span><b class="${c}">${h}</b></div>`;
const fmt = d => d ? new Date(d).toLocaleDateString("en-IN", {day: "numeric", month: "long", year: "numeric"}) : "";
function cropper(src, onSave) {
  const m = document.createElement("div"); m.className = "modal";
  m.innerHTML = `<div class="sheet"><canvas id="cv" width="280" height="280"></canvas><input type="range" id="zm" min="1" max="4" step="0.01" value="1" aria-label="Zoom"><button class="btn" id="sv">Save photo</button><button class="link" id="cn">Cancel</button></div>`;
  document.body.appendChild(m);
  const cv = $("#cv", m), x = cv.getContext("2d"), V = 280, img = new Image();
  let z = 1, ox = 0, oy = 0, drag = null;
  const dims = () => { const k = Math.max(V / img.width, V / img.height) * z; return [img.width * k, img.height * k]; };
  const draw = () => { const [w, h] = dims(); ox = Math.min(0, Math.max(V - w, ox)); oy = Math.min(0, Math.max(V - h, oy)); x.fillStyle = "#000"; x.fillRect(0, 0, V, V); x.drawImage(img, ox, oy, w, h); };
  img.onload = () => { const [w, h] = dims(); ox = (V - w) / 2; oy = (V - h) / 2; draw(); };
  img.onerror = () => { m.remove(); toast("Could not open this photo.", true); };
  img.src = src;
  cv.onpointerdown = e => { drag = [e.clientX - ox, e.clientY - oy]; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => { if (drag) { ox = e.clientX - drag[0]; oy = e.clientY - drag[1]; draw(); } };
  cv.onpointerup = () => { drag = null; };
  $("#zm", m).oninput = e => {
    const [w0, h0] = dims(), cx = (V / 2 - ox) / w0, cy = (V / 2 - oy) / h0;
    z = +e.target.value; const [w, h] = dims(); ox = V / 2 - cx * w; oy = V / 2 - cy * h; draw();
  };
  $("#cn", m).onclick = () => m.remove();
  $("#sv", m).onclick = () => act($("#sv", m), async () => {
    const o = document.createElement("canvas"); o.width = o.height = 512;
    const f = 512 / V, [w, h] = dims();
    o.getContext("2d").drawImage(img, ox * f, oy * f, w * f, h * f);
    const blob = await new Promise(r => o.toBlob(r, "image/jpeg", 0.85));
    if (!blob) { toast("Could not save the photo.", true); return; }
    await onSave(blob); m.remove();
  });
}
async function savePhoto(blob) {
  const path = `${me.id}/avatar.jpg`;
  await call(sb.storage.from("avatars").upload(path, blob, {upsert: true, contentType: "image/jpeg"}));
  await call(sb.rpc("set_my_photo", {p_path: path}));
  me.photo_path = path; toast("Photo updated."); await profile();
}
async function removePhoto() {
  if (!confirm("Remove your profile photo?")) return;
  await call(sb.storage.from("avatars").remove([me.photo_path]));
  await call(sb.rpc("set_my_photo", {p_path: null}));
  me.photo_path = null; toast("Photo removed."); await profile();
}
function photoMenu(url) {
  const m = document.createElement("div"); m.className = "modal";
  m.innerHTML = `<div class="sheet"><button class="btn" id="p1">Choose new photo</button>${url ? '<button class="btn" id="p3" style="background:var(--bad);color:#fff">Remove photo</button>' : ""}<button class="link" id="p0">Cancel</button></div>`;
  document.body.appendChild(m);
  $("#p0", m).onclick = () => m.remove();
  $("#p1", m).onclick = () => { m.remove(); $("#ph").click(); };
  if (url) $("#p3", m).onclick = () => { m.remove(); removePhoto().catch(() => {}); };
}
async function profile() {
  let url = "";
  if (me.photo_path) url = (await sb.storage.from("avatars").createSignedUrl(me.photo_path, 3600)).data?.signedUrl || "";
  $("#v").innerHTML = `<div class="card ctr"><div class="av">${url ? `<img src="${esc(url)}" alt="Profile photo">` : esc((me.full_name || "M")[0].toUpperCase())}<button class="cam" id="cam" aria-label="Photo options">📷</button></div>
    <input type="file" id="ph" accept="image/*" hidden>
    <h2 class="nm" style="font-size:1.5rem;margin:14px 0 4px">${esc(me.full_name || "Member")}</h2><p class="idw" style="font-size:1.25rem;font-weight:700;margin:0 0 6px">${idHtml(me.member_code)}</p><p class="mut">Account status: ${esc(me.status)}</p></div>
  <h3 class="sec">PROFILE OVERVIEW</h3>${fld("Email address", me.email)}${fld("Mobile number", me.mobile)}${fld("Location", me.city)}
  <button class="btn" id="od">OPEN PROFILE DETAILS</button>`;
  $("#od").onclick = () => go("pdetails");
  $("#cam").onclick = () => photoMenu(url);
  $("#ph").onchange = e => { const f = e.target.files[0]; e.target.value = ""; if (f) cropper(URL.createObjectURL(f), savePhoto); };
}
async function pdetails() {
  const sp = ((await sb.rpc("get_my_sponsor")).data || [])[0];
  $("#v").innerHTML = `<h3 class="sec">Personal Information</h3>${fld("Full name", me.full_name, "nm")}${fld("Date of birth", me.dob)}${fld("Gender", me.gender)}${fld("Email address", me.email)}${fld("Mobile number", me.mobile)}
  <h3 class="sec">Address Details</h3>${fld("House / building", me.house)}${fld("Street / area", me.street)}${fld("City / town", me.city)}${fld("District", me.district)}${fld("State", me.state)}${fld("Pincode", me.pincode)}${fld("Country", me.country)}
  <h3 class="sec">Nominee Details</h3>${fld("Nominee full name", me.nominee_name, "nm")}${fld("Relationship with member", me.nominee_relation)}${fld("Date of birth", me.nominee_dob)}${fld("Gender", me.nominee_gender)}${fld("Mobile number", me.nominee_mobile)}${fld("Email address", me.nominee_email)}${fld("Complete address", me.nominee_address)}
  <h3 class="sec">Account Details</h3>${fldH("Member ID", idHtml(me.member_code), "idw")}${fldH("Sponsor ID", sp?.member_code ? idHtml(sp.member_code) : "Not assigned", "idw")}${fld("Sponsor name", sp?.full_name, "nm")}${fld("Date of joining", fmt(me.created_at))}${fld("Account status", me.status)}${fld("Rank", RANKS[me.rank_level || 0])}
  <h3 class="sec">Account Security</h3>${fld("Email verification", authUser?.email_confirmed_at ? "Verified" : "Not verified")}${fld("Mobile verification", "Not verified / unavailable")}
  <button class="btn" id="ed">EDIT PROFILE DETAILS</button>`;
  $("#ed").onclick = () => go("pedit");
}
const EF = [["full_name", "Full name"], ["dob", "Date of birth", "date"], ["gender", "Gender", "sel:Male,Female,Other"], ["mobile", "Mobile number", "tel"],
  ["house", "House / building"], ["street", "Street / area"], ["city", "City / town"], ["district", "District"], ["state", "State"], ["pincode", "Pincode", "tel"], ["country", "Country"],
  ["nominee_name", "Nominee full name"], ["nominee_relation", "Relationship with member"], ["nominee_dob", "Nominee date of birth", "date"], ["nominee_gender", "Nominee gender", "sel:Male,Female,Other"],
  ["nominee_mobile", "Nominee mobile number", "tel"], ["nominee_email", "Nominee email address", "email"], ["nominee_address", "Nominee complete address"]];
async function pedit() {
  $("#v").innerHTML = `<form id="ef" class="card">${EF.map(([k, l, t = "text"]) => t.startsWith("sel")
    ? `<label>${l}<select name="${k}"><option value="">Not set</option>${t.slice(4).split(",").map(o => `<option${me[k] === o ? " selected" : ""}>${o}</option>`).join("")}</select></label>`
    : `<label>${l}<input name="${k}" type="${t}" value="${esc(me[k])}"${k === "full_name" ? " required" : ""}></label>`).join("")}<button class="btn">Save changes</button></form>`;
  $("#ef").onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries([...new FormData(e.target)].map(([k, x]) => [k, x.trim() || null]));
    act($(".btn"), async () => {
      await call(sb.rpc("save_my_profile", {p_data: d}));
      me = {...me, ...d}; toast("Profile saved."); hist.pop(); go("pdetails", false);
    });
  };
}

/* ---------- bank details and KYC (Main ID only) ---------- */
function shrink(file, max = 1600) {
  return new Promise((res, rej) => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
      c.toBlob(b => b ? res(b) : rej(new Error("Could not read the photo.")), "image/jpeg", 0.8);
    };
    img.onerror = () => rej(new Error("Could not read the photo.")); img.src = u;
  });
}
const loadKyc = async () => {
  const k = (await sb.from("kyc").select("*").eq("user_id", me.member_code).maybeSingle()).data || {};
  return {...k, pan_number: k.pan};
};
const saveKyc = patch => call(sb.rpc("save_kyc_partial", {p: patch}));
const KS = {Pending: "Waiting for review", Approved: "Approved", Rejected: "Rejected"};
const docBox = (label, key, has) => `<div class="card"><b>${label}</b><p class="note">${has ? "Uploaded. You can upload again to replace it." : "Not uploaded yet."}</p>
  <button class="btn ghost" data-k="${key}" data-m="c">Scan with camera</button><button class="btn ghost" data-k="${key}" data-m="f">Upload photo</button>
  <input type="file" accept="image/*" capture="environment" hidden id="c-${key}"><input type="file" accept="image/*" hidden id="f-${key}"></div>`;
function bindDocs(keys, again) {
  $("#v").querySelectorAll("[data-k]").forEach(b => b.onclick = () => $("#" + b.dataset.m + "-" + b.dataset.k).click());
  keys.forEach(k => ["c", "f"].forEach(p => $("#" + p + "-" + k).onchange = e => {
    const f = e.target.files[0]; e.target.value = ""; if (!f) return;
    act(e.target, async () => {
      const path = `${me.id}/${k}.jpg`;
      await call(sb.storage.from("kyc").upload(path, await shrink(f), {upsert: true, contentType: "image/jpeg"}));
      await saveKyc({[k + "_path"]: path}); toast("Photo uploaded."); await again();
    });
  }));
}
function saveForm(id, again) {
  $(id).onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries([...new FormData(e.target)].map(([k, x]) => [k, k === "ifsc" || k === "pan_number" ? x.trim().toUpperCase() : x.trim()]));
    act($(".btn", e.target), async () => { await saveKyc(d); toast("Saved."); await again(); });
  };
}
function childNote() {
  $("#v").innerHTML = '<div class="card"><h2>KYC is done on the Main ID</h2><p class="mut">Bank details and KYC are only needed on the Main ID. This Child ID uses the same KYC status.</p></div>';
}
async function bank() {
  if (me.id_type === "child") return childNote();
  const k = await loadKyc();
  $("#v").innerHTML = `<form id="bf" class="card"><h2>Account details</h2>
    <label>Account holder name<input name="account_holder" value="${esc(k.account_holder)}" required></label>
    <label>Bank name<input name="bank_name" value="${esc(k.bank_name)}" required></label>
    <label>Account number<input name="account_number" inputmode="numeric" value="${esc(k.account_number)}" required></label>
    <label>IFSC code<input name="ifsc" autocapitalize="characters" value="${esc(k.ifsc)}" required></label>
    <button class="btn gold">Save account details</button></form>
  ${docBox("Passbook photo", "passbook", k.passbook_path)}<button class="btn ghost" id="nx">KYC details</button>`;
  saveForm("#bf", bank); bindDocs(["passbook"], bank);
  $("#nx").onclick = () => go("kycdocs");
}
async function kycdocs() {
  if (me.id_type === "child") return childNote();
  const k = await loadKyc();
  $("#v").innerHTML = `<div class="card"><span class="note">KYC status</span><b>${KS[k.status] || "Not submitted"}</b></div>
  ${docBox("Aadhaar card", "aadhaar", k.aadhaar_path)}${docBox("PAN card", "pan", k.pan_path)}
  <form id="kf" class="card"><label>PAN number<input name="pan_number" autocapitalize="characters" value="${esc(k.pan_number)}" required></label><button class="btn gold">Save PAN number</button></form>`;
  saveForm("#kf", kycdocs); bindDocs(["aadhaar", "pan"], kycdocs);
}
