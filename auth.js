/* OCTO7 | auth.js - welcome, public pages, login, registration, activation */
function welcomeView() {
  app.innerHTML = `<div class="w2 enter"><div class="wtop"><img src="wordmark.webp" alt="OCTO7" onerror="this.replaceWith(Object.assign(document.createElement('h1'),{textContent:'OCTO7'}))"></div>
  <div class="wmid"><img src="globe.webp" alt="OCTO7 logo" onerror="this.remove()"></div>
  <div class="wbot"><button class="signin" id="si">Sign In</button><p class="su">Don’t have an account? <button class="sup" id="su">Sign Up</button></p>
  <div class="wf">${[["about", "About us"], ["products", "Products"], ["opp", "Opportunity"], ["contact", "Contact us"]].map(([k, l], i) => `${i ? "<i>|</i>" : ""}<button data-k="${k}">${l}</button>`).join("")}</div></div></div>`;
  $("#si").onclick = () => authView("login");
  $("#su").onclick = () => authView("reg");
  app.querySelectorAll(".wf button").forEach(b => b.onclick = () => pubView(b.dataset.k));
}
const PUBT = {about: "About us", products: "Products", opp: "Opportunity", contact: "Contact us"};
async function pubView(k) {
  app.innerHTML = `<div class="tb enter"><button class="bk" id="bk" aria-label="Back">←</button><b>${PUBT[k]}</b></div><main id="v" class="enter"><p class="mut">Loading…</p></main>`;
  $("#bk").onclick = welcomeView;
  const blk = t => t ? `<div class="card" style="white-space:pre-wrap">${esc(t)}</div>` : '<div class="card"><p class="mut">This information will be added soon.</p></div>';
  if (k === "products") {
    const {data} = await sb.from("products").select("id,name,description,price").eq("active", true).order("created_at");
    $("#v").innerHTML = (data || []).map(x => `<div class="card"><b>${esc(x.name)}</b><br><span class="note">${esc(x.description || "")}</span><br><b>${inr(x.price)}</b></div>`).join("") || blk("");
    return;
  }
  const i = (await sb.rpc("public_info")).data || {};
  if (k === "about") $("#v").innerHTML = blk(i.about_text);
  else if (k === "opp") $("#v").innerHTML = blk(i.opportunity_text);
  else $("#v").innerHTML = `<div class="card">${i.help_phone ? `<div class="row"><span>Phone</span><a class="link" href="tel:${esc(i.help_phone)}">${esc(i.help_phone)}</a></div>` : ""}${i.help_email ? `<div class="row"><span>Email</span><a class="link" href="mailto:${esc(i.help_email)}">${esc(i.help_email)}</a></div>` : ""}${i.help_hours ? `<div class="row"><span>Hours</span><b>${esc(i.help_hours)}</b></div>` : ""}${i.help_phone || i.help_email || i.help_hours ? "" : '<p class="mut">Contact details will be added soon.</p>'}</div>`;
}

function authView(mode = "login") {
  if (mode === "reg") return regView();
  app.innerHTML = `<main class="auth"><button class="link back" id="bk">Back</button>
  <h2 style="font-size:1.6rem;margin:6px 0 12px">Member login</h2>
  <form id="f" class="card">${idField("uid", "User ID")}${pwf("pw", "Password", "current-password")}<button class="btn">Log in</button></form>
  <button class="link" id="sw">New member? Register</button></main>`;
  $("#bk").onclick = welcomeView; $("#sw").onclick = () => authView("reg");
  $("#f").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    act($(".btn"), async () => {
      const code = fullId(f.get("uid")), password = f.get("pw");
      const em = await call(sb.rpc("login_identity", {p_code: code}));
      if (!em) { toast("Wrong user ID or password.", true); return; }
      if (em === "LOCKED") { toast("Too many wrong attempts. Please try again after 15 minutes.", true); return; }
      const {error} = await sb.auth.signInWithPassword(em.startsWith("tel:") ? {phone: "+" + em.slice(4), password} : {email: em, password});
      await sb.rpc("record_login_attempt", {p_user: code, p_success: !error});
      if (error) { toast("Wrong user ID or password.", true); return; }
      await loadMe();
    });
  };
}

/* registration form, used by the public page, the menu and the vacant places in Genealogy */
function regHtml(c) {
  const slot = c.mode === "slot";
  return `<form id="rf" class="card">
    <label>Full name<input name="name" required autocomplete="off"></label>
    <label>Mobile number<input name="mobile" inputmode="tel" required autocomplete="off"></label>
    <label>Email address (optional)<input name="email" type="email" autocomplete="off"></label>
    ${idField("sp", "Sponsor ID", true, idRest(c.sponsor))}
    ${c.mode === "menu" ? `<label>Placement ID<select name="pa" id="pa">${c.slots.map(x => `<option value="${esc(x.code)}">${esc(x.code)}${x.name ? " - " + esc(x.name) : ""}</option>`).join("")}</select></label>` : ""}
    ${slot ? `<label>Placement ID<div class="idf"><span>OCTO7</span><input value="${esc(idRest(c.parent))}" readonly></div></label><p class="note" style="margin:-6px 0 12px">The new member is placed on the ${c.side === "R" ? "right" : "left"} under this ID.</p>`
      : `<label>${c.mode === "menu" ? "Side" : "Side under your sponsor"}<select name="side"><option value="L">Left</option><option value="R">Right</option></select></label>`}
    ${pwf("pw", "New password", "new-password")}${pwf("pw2", "Confirm password", "new-password")}
    <label>Verification<select name="otpm"><option value="" disabled selected>Enter OTP</option><option value="email">Email OTP</option><option value="sms">SMS OTP</option></select></label>
    <button class="btn" type="button" id="so">Send OTP</button>
    <div id="ob" hidden><label style="margin-top:14px">Type OTP<input name="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="10"></label><button class="btn gold" type="button" id="co">Confirm OTP</button></div></form>`;
}
function regLogic(c) {
  const f = $("#rf"); let ctx = null;
  $("#so").onclick = e => act(e.target, async () => {
    if (!f.reportValidity()) return;
    const d = Object.fromEntries(new FormData(f)), sp = fullId(d.sp), m = d.otpm, email = (d.email || "").trim(), mob = String(d.mobile).replace(/\D/g, "");
    if (d.pw !== d.pw2) { toast("The two passwords do not match.", true); return; }
    if (!m) { toast("Choose Email OTP or SMS OTP.", true); return; }
    if (m === "email" && !email) { toast("Enter an email address to get an email OTP.", true); return; }
    if (mob.length < 10) { toast("Enter a valid mobile number.", true); return; }
    if (!(await call(sb.rpc("check_sponsor", {p_code: sp})))) { toast("Sponsor ID not found. Check it or contact the company.", true); return; }
    const tmp = supabase.createClient(SB_URL, SB_KEY, {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}});
    const cred = m === "email" ? {email} : {phone: "+91" + mob.slice(-10)}, side = c.mode === "slot" ? c.side : d.side;
    const {data, error} = await tmp.auth.signUp({...cred, password: d.pw, options: {data: {full_name: d.name.trim(), mobile: mob}}});
    if (error) { toast(error.message, true); return; }
    if (!data.user || data.user.identities?.length === 0) { toast("This email or mobile number is already registered.", true); return; }
    if (data.session) { toast("OTP verification is switched off on the server. Please contact the company.", true); return; }
    ctx = {tmp, cred, m, side, sp, d, mob, email, parent: c.mode === "public" ? null : (c.mode === "slot" ? c.parent : fullId(d.pa))};
    $("#ob").hidden = false; toast(m === "email" ? "OTP sent to the email address." : "OTP sent by SMS.");
  });
  $("#co").onclick = e => act(e.target, async () => {
    const token = f.otp.value.trim();
    if (!ctx || !token) { toast("Type the OTP first.", true); return; }
    let r = await ctx.tmp.auth.verifyOtp({...ctx.cred, token, type: ctx.m === "email" ? "signup" : "sms"});
    if (r.error && ctx.m === "email") r = await ctx.tmp.auth.verifyOtp({...ctx.cred, token, type: "email"});
    if (r.error || !r.data.user) { toast("The OTP is wrong or has expired.", true); return; }
    const reg = await ctx.tmp.rpc("register_member2", {p_name: ctx.d.name.trim(), p_mobile: ctx.mob, p_email: ctx.email || null, p_sponsor: ctx.sp, p_parent: ctx.parent, p_position: ctx.side});
    if (reg.error) { toast("OTP verified, but registration failed: " + reg.error.message, true); return; }
    await c.done(reg.data, ctx);
  });
}
const okCard = (code, note, btn) => `<div class="card ctr"><h2 class="pos">Registration successful</h2><p class="note">Member ID</p><p class="id" style="font-size:1.6rem">${idHtml(code)}</p><p class="note">${note}</p>${btn || ""}</div>`;
function regView() {
  app.innerHTML = `<main class="auth"><button class="link back" id="bk">Back</button><h2 style="font-size:1.6rem;margin:6px 0 12px">New member registration</h2>${regHtml({mode: "public", sponsor: ""})}<button class="link" id="sw">I already have an account</button></main>`;
  $("#bk").onclick = welcomeView; $("#sw").onclick = () => authView("login");
  regLogic({mode: "public", done: async (code, ctx) => {
    await ctx.tmp.auth.signOut();
    $("#rf").outerHTML = okCard(code, "Use this User ID and your password to log in.", '<button class="btn" id="gl">Go to login</button>');
    $("#gl").onclick = () => authView("login");
  }});
}

/* ---------- after sign in ---------- */
async function loadMe() {
  const {data: {user}} = await sb.auth.getUser();
  if (!user) return welcomeView();
  const m = await fetchMe(user);
  if (!m) { toast("Your member profile was not found. Please contact the company.", true); await sb.auth.signOut(); return welcomeView(); }
  me = m; await loadSettings();
  if (me.status === "blocked" || me.status === "suspended") return gate("Account " + me.status, "Please contact the company help line.");
  if (me.status === "pending") return activateView();
  authUser = user;
  isAdmin = (await sb.rpc("is_admin")).data === true;
  page = "portal"; hist = [];
  render();
}
function gate(title, text, again) {
  app.innerHTML = `<main class="auth"><h1>${esc(title)}</h1><p class="mut">${esc(text)}</p>
  ${again ? '<button class="btn" id="ag">Check again</button>' : ""}<button class="link" id="lo">Log out</button></main>`;
  $("#lo").onclick = logout;
  if (again) $("#ag").onclick = () => loadMe();
}
async function logout() { await sb.auth.signOut(); me = null; page = "portal"; hist = []; welcomeView(); }

function activateView() {
  app.innerHTML = `<main class="auth"><h1>Activate your ID</h1>
  <p class="mut">Enter the secret pin you received from the company or your team leader.</p>
  <form id="f" class="card">${pwf("pin", "Activation pin", "off", 1)}
  <button class="btn">Activate</button></form><button class="link" id="lo">Log out</button></main>`;
  $("#lo").onclick = logout;
  $("#f").onsubmit = e => {
    e.preventDefault();
    act($(".btn"), async () => {
      await call(sb.rpc("activate_with_pin", {p_pin: new FormData(e.target).get("pin")}));
      toast("Your ID is active."); await loadMe();
    });
  };
}
