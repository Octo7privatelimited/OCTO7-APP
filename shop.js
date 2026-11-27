/* OCTO7 | shop.js - products, orders and wallet */
async function shop() {
  const [p, o] = await Promise.all([
    sb.from("products").select("*").eq("active", true).order("created_at"),
    sb.from("orders").select("*").eq("user_id", me.member_code).order("created_at", {ascending: false}).limit(10)]);
  const items = p.data || [];
  $("#v").innerHTML = `<h2>Products</h2>${items.map(x => `<div class="card"><div class="row" style="border:0;padding:0">
    <div><b>${esc(x.name)}</b><br><span class="note">${esc(x.description || "")}</span><br><b>${inr(x.price)}</b></div>
    <div class="qty"><button data-id="${x.id}" data-d="-1" aria-label="Less">−</button><span id="q-${x.id}">${cart[x.id] || 0}</span><button data-id="${x.id}" data-d="1" aria-label="More">+</button></div></div></div>`).join("") || '<p class="mut">No products are listed yet. Please check back soon.</p>'}
  ${items.length ? `<div class="card"><div class="row" style="border:0"><span>Order total</span><b id="tot"></b></div><button class="btn" id="po">Place order</button>
  <p class="note" style="margin-top:8px">The company confirms your order after payment and updates its status here.</p></div>` : ""}
  <h2>My orders</h2><div class="card">${(o.data || []).map(x => `<div class="row"><span>${day(x.created_at)}</span><span class="tag">${STATUS[x.status] || x.status}</span><b>${inr(x.net_amount)}</b></div>`).join("") || '<p class="mut">You have not placed an order yet.</p>'}</div>`;
  const total = () => { const t = $("#tot"); if (t) t.textContent = inr(items.reduce((s, x) => s + (cart[x.id] || 0) * x.price, 0)); };
  total();
  $("#v").querySelectorAll(".qty button").forEach(b => b.onclick = () => {
    const id = b.dataset.id; cart[id] = Math.max(0, Math.min(100, (cart[id] || 0) + +b.dataset.d));
    $("#q-" + id).textContent = cart[id]; total();
  });
  const po = $("#po");
  if (po) po.onclick = () => act(po, async () => {
    const list = Object.entries(cart).filter(([, q]) => q > 0).map(([product_id, qty]) => ({product_id, qty}));
    if (!list.length) { toast("Choose at least one product.", true); return; }
    await call(sb.rpc("place_cart_order", {p_items: list}));
    cart = {}; toast("Order placed."); await shop();
  });
}
async function wallet() {
  const w = await call(sb.from("members").select("wallet_balance").eq("user_id", me.member_code).maybeSingle());
  const min = +cfg.min_withdraw || 0, pct = +cfg.admin_charge_percent || 0, tds = +cfg.tds_percent || 0, isChild = me.id_type === "child";
  $("#v").innerHTML = `<section class="hero"><p>Available balance</p><div class="bal">${inr(w?.wallet_balance)}</div></section>
  ${isChild ? `<form id="tf" class="card"><h2>Transfer to Main ID</h2>
    <label>Amount (minimum ${inr(cfg.min_transfer)})<input name="amt" type="number" inputmode="decimal" min="${+cfg.min_transfer || 0}" step="1" required></label>
    <button class="btn">Transfer to ${esc(me.main_id)}</button></form>
    <p class="note">Withdrawals are made from the Main ID only.</p>`
  : `<form id="wf" class="card"><h2>Withdraw</h2>
    <label>Withdrawal amount (minimum ${inr(min)})<input name="amt" type="number" inputmode="decimal" min="${min}" step="1" required></label>
    <p class="note" id="pv">Admin charge ${pct}% and TDS as per the income tax rules are deducted. KYC must be approved.</p>
    <button class="btn">Withdraw</button></form>`}
  <button class="btn" id="pd">Payout Details</button>`;
  $("#pd").onclick = () => go("payouts");
  if (isChild) {
    $("#tf").onsubmit = e => {
      e.preventDefault();
      act($(".btn", e.target), async () => {
        await call(sb.rpc("transfer_to_main", {p_child: me.member_code, p_amount: +e.target.amt.value}));
        toast("Transferred."); await wallet();
      });
    };
    return;
  }
  const f = $("#wf");
  f.amt.oninput = () => {
    const a = +f.amt.value || 0;
    $("#pv").textContent = a ? `Admin charge about ${inr(a * pct / 100)}. TDS (${tds}% with PAN, 20% without PAN, after ₹20,000 a year) is also deducted.` : `Admin charge ${pct}% and TDS as per the income tax rules are deducted. KYC must be approved.`;
  };
  f.onsubmit = e => {
    e.preventDefault();
    act($(".btn", f), async () => {
      await call(sb.rpc("request_withdrawal", {p_amount: +f.amt.value}));
      toast("Withdrawal requested."); await wallet();
    });
  };
}
