/* OCTO7 - "My IDs" add-on.
   Loaded AFTER the main script of index.html:  <script src="ids.js"></script>
   One person can have up to 3 IDs on one PAN. Every ID has its own User ID,
   password, wallet and place in the tree. They share name, email, mobile and PAN. */
(() => {
  ICO.idcard = '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16c.6-1.5 1.8-2 3-2s2.4.5 3 2M14 10h5M14 14h4"/>';
  MENU.splice(MENU.length - 1, 0, ["idcard", "My IDs", "myids"]);
  PAGES.myids = {t: "My IDs", f: myids};

  async function myids() {
    const ids = await call(sb.rpc("my_ids"));
    const main = ids.find(x => x.is_main), isMain = !!main && main.member_code === me.member_code;
    const list = `<div class="card"><h2>Your IDs</h2>
      <p class="note">One PAN can have up to 3 IDs. Every ID has its own User ID and password, its own wallet and its own place in the tree. They share your name, email address, mobile number and PAN.</p>
      ${ids.map(x => `<div class="row"><span><b>${esc(x.member_code)}</b><br><span class="note">${x.is_main ? "Main ID" : "Extra ID"}${x.parent_code ? ", under " + esc(x.parent_code) + " (" + (x.side === "L" ? "left" : "right") + ")" : ""}</span></span><span class="tag">${esc(x.status)}</span></div>`).join("")}</div>`;
    if (!isMain) { $("#v").innerHTML = list + '<p class="note">New IDs can be created only from the main ID.</p>'; return; }
    if (ids.length >= 3) { $("#v").innerHTML = list + '<p class="note">All 3 IDs are already created.</p>'; return; }

    const T = await call(sb.rpc("get_my_team", {p_max_depth: 10})), occ = {};
    T.forEach(r => { if (r.parent_code) { occ[r.parent_code] = occ[r.parent_code] || {}; occ[r.parent_code][r.side] = 1; } });
    const slots = T.map(r => ({code: r.member_code, name: r.full_name, L: !(occ[r.member_code] || {}).L, R: !(occ[r.member_code] || {}).R})).filter(x => x.L || x.R);
    if (!slots.length) { $("#v").innerHTML = list + '<p class="note">There is no vacant place in your team for a new ID right now.</p>'; return; }

    $("#v").innerHTML = list + `<form id="cf" class="card"><h2>Create another ID</h2>
      <label>Placement ID<select name="pa" id="cpa">${slots.map(x => `<option value="${esc(x.code)}">${esc(x.code)}${x.name ? " - " + esc(x.name) : ""}</option>`).join("")}</select></label>
      <label>Side<select name="side"></select></label>
      ${pwf("pw", "Password for the new ID", "new-password")}${pwf("pw2", "Confirm password", "new-password")}
      <button class="btn">Create ID</button>
      <p class="note" style="margin-top:8px">The new ID needs its own activation pin before it can be used.</p></form>`;
    const fill = () => {
      const x = slots.find(y => y.code === $("#cpa").value) || {};
      $("select[name=side]").innerHTML = [["L", "Left"], ["R", "Right"]].filter(([k]) => x[k]).map(([k, l]) => `<option value="${k}">${l}</option>`).join("");
    };
    $("#cpa").onchange = fill; fill();
    $("#cf").onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      if (f.get("pw") !== f.get("pw2")) { toast("The two passwords do not match.", true); return; }
      act($(".btn", e.target), async () => {
        const code = await call(sb.rpc("create_child_id", {p_password: f.get("pw"), p_parent_code: f.get("pa"), p_side: f.get("side")}));
        toast("New ID created: " + code);
        await myids();
      });
    };
  }
})();
