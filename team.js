/* OCTO7 | team.js - genealogy tree and new member registration */
async function team() {
  const T = await call(sb.rpc("get_my_team", {p_max_depth: 10})), by = {};
  T.forEach(r => by[r.member_code] = r);
  const kid = (c, sd) => T.find(r => r.parent_code === c && r.side === sd);
  if (!by[treeRoot]) treeRoot = me.member_code;
  const cell = (r, parent, sd, span) => r
    ? `<button class="nd" data-c="${esc(r.member_code)}" style="grid-column:span ${span}"><b>${esc((r.full_name || "").split(" ")[0] || "Member")}</b><span>${idStack(r.member_code)}</span><small>${r.status === "active" ? "Active" : "Pending"}</small></button>`
    : `<button class="nd vac" data-p="${esc(parent)}" data-s="${sd}" style="grid-column:span ${span}"><b>+</b><span>${sd === "L" ? "Left" : "Right"}</span><small>vacant</small></button>`;
  const l1 = ["L", "R"].map(sd => kid(treeRoot, sd));
  const l2 = l1.flatMap(p => ["L", "R"].map(sd => p ? cell(kid(p.member_code, sd), p.member_code, sd, 1) : '<div class="nd gap"></div>'));
  const r = by[treeRoot];
  $("#v").innerHTML = `<div class="card">${treeRoot !== me.member_code ? '<button class="link" id="up" style="padding-top:0">Up one level</button>' : ""}
  <div class="bt"><div class="nd root" style="grid-column:span 4"><b>${esc(r.full_name || "Member")}</b><span>${idStack(r.member_code)}</span></div>
  ${l1.map((p, i) => cell(p, treeRoot, i ? "R" : "L", 2)).join("")}${l2.join("")}</div></div>
  <p class="note">Tap a member to see their team. Tap a vacant place to register a new member there.</p>`;
  if ($("#up")) $("#up").onclick = () => { treeRoot = r.parent_code; team(); };
  $("#v").querySelectorAll("[data-c]").forEach(b => b.onclick = () => { treeRoot = b.dataset.c; team(); });
  $("#v").querySelectorAll(".vac").forEach(b => b.onclick = () => { regPre = {parent: b.dataset.p, side: b.dataset.s}; go("newreg"); });
}
async function newreg() {
  const pre = regPre; regPre = null;
  let c;
  if (pre) c = {mode: "slot", sponsor: me.member_code, parent: pre.parent, side: pre.side};
  else {
    const T = await call(sb.rpc("get_my_team", {p_max_depth: 10})), occ = {};
    T.forEach(r => { if (r.parent_code) { occ[r.parent_code] = occ[r.parent_code] || {}; occ[r.parent_code][r.side] = 1; } });
    const slots = T.map(r => ({code: r.member_code, name: r.full_name, L: !(occ[r.member_code] || {}).L, R: !(occ[r.member_code] || {}).R})).filter(x => x.L || x.R);
    if (!slots.length) { $("#v").innerHTML = '<div class="card"><p class="mut">There are no vacant places in your team right now.</p></div>'; return; }
    c = {mode: "menu", sponsor: me.member_code, slots};
  }
  $("#v").innerHTML = regHtml(c);
  if (c.mode === "menu") {
    const fill = () => { const x = c.slots.find(y => y.code === $("#pa").value) || {}; $("select[name=side]").innerHTML = [["L", "Left"], ["R", "Right"]].filter(([k]) => x[k]).map(([k, l]) => `<option value="${k}">${l}</option>`).join(""); };
    $("#pa").onchange = fill; fill();
  }
  regLogic({...c, done: async (code, ctx) => {
    await ctx.tmp.auth.signOut();
    $("#rf").outerHTML = okCard(code, "Ask the member to log in with this ID and password. To start, the member needs an activation pin from the company.");
  }});
}
