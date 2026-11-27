/* OCTO7 | app.js - page table and start-up (must load last) */
const PAGES = {portal: {t: "Member Portal", f: portal}, menu: {t: "Member Menu", f: menu}, dash: {t: "Dashboard", f: home}, profile: {t: "My Profile", f: profile},
  pdetails: {t: "My Profile Details", f: pdetails}, pedit: {t: "Edit Profile Details", f: pedit}, tree: {t: "Genealogy", f: team}, newreg: {t: "New Member Registration", f: newreg},
  shop: {t: "Products & Catalog", f: shop}, orders: {t: "My Purchases / Orders", f: orders}, wallet: {t: "Wallet & Withdrawals", f: wallet}, payouts: {t: "Payout Details", f: payouts},
  coupons: {t: "My Coupons & Pins", f: coupons}, notes: {t: "Notifications", f: notes}, password: {t: "Change Password", f: password}, soon: {t: "", f: soon}, help: {t: "Help Line & Support", f: async () => help()},
  bank: {t: "Bank Details & KYC", f: bank}, kycdocs: {t: "KYC Documents", f: kycdocs}, fa: {t: "", f: fa}, cpd: {t: "Coupon & Pin Dashboard", f: cpd}, cpg: {t: "Generate Pin & Distribution", f: cpg},
  cph: {t: "Coupon & Pin History", f: cph}, wdm: {t: "Withdrawal Management", f: wdm}, kycr: {t: "KYC Review", f: kycr}, ords: {t: "Orders & Delivery", f: ords}, prodm: {t: "Products", f: prodm},
  bvrun: {t: "BV Matching & Expiry", f: bvrun}, pubedit: {t: "Website Pages", f: pubedit}};

sb.auth.onAuthStateChange(ev => { if (ev === "SIGNED_OUT") welcomeView(); });
const start = () => sb.auth.getSession().then(({data}) => data.session ? loadMe() : welcomeView());
const nv = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
if (nv && nv.type !== "navigate") start();
else {
  const sp = $("#splash"), im = $("img", sp); sp.hidden = false;
  const run = () => {
    im.classList.add("go");
    setTimeout(() => {
      document.body.classList.add("noenter"); app.classList.add("over");
      start();
      setTimeout(() => { app.classList.remove("over"); document.body.classList.remove("noenter"); sp.remove(); }, 650);
    }, 3500);
  };
  im.onerror = () => { sp.remove(); start(); };
  if (im.complete && im.naturalWidth) run(); else im.onload = run;
}
