const depositsHistory = document.getElementById("depositsHistory");
const withdrawalsHistory = document.getElementById("withdrawalsHistory");
const codesHistory = document.getElementById("codesHistory");

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ar-EG");
}

async function getCurrentProfile() {
  const { data: auth } = await supabaseClient.auth.getUser();

  if (!auth?.user) {
    window.location.href = "login.html";
    return null;
  }

  const { data: profile, error } = await supabaseClient
    .from("users")
    .select("*")
    .eq("auth_user_id", auth.user.id)
    .single();

  if (error || !profile) {
    window.location.href = "login.html";
    return null;
  }

  return profile;
}

async function loadDeposits(profile) {
  const { data, error } = await supabaseClient
    .from("deposits")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (error || !data || !data.length) {
    depositsHistory.innerHTML = `<p class="note">لا توجد إيداعات</p>`;
    return;
  }

  depositsHistory.innerHTML = data.map(item => `
    <div class="deposit-item">
      <div class="deposit-row">
        <span>المبلغ</span>
        <strong>${formatMoney(item.amount)} دولار</strong>
      </div>

      <div class="deposit-row">
        <span>الشبكة</span>
        <strong>${item.network || "TRC20"}</strong>
      </div>

      <div class="deposit-row">
        <span>الحالة</span>
        <strong>${item.status || "-"}</strong>
      </div>

      <div class="deposit-row">
        <span>التاريخ</span>
        <strong>${formatDate(item.created_at)}</strong>
      </div>
    </div>
  `).join("");
}

async function loadWithdrawals(profile) {
  const { data, error } = await supabaseClient
    .from("withdrawals")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (error || !data || !data.length) {
    withdrawalsHistory.innerHTML = `<p class="note">لا توجد سحوبات</p>`;
    return;
  }

  withdrawalsHistory.innerHTML = data.map(item => `
    <div class="deposit-item">
      <div class="deposit-row">
        <span>المبلغ</span>
        <strong>${formatMoney(item.amount)} دولار</strong>
      </div>

      <div class="deposit-row">
        <span>الشبكة</span>
        <strong>${item.network || "TRC20"}</strong>
      </div>

      <div class="deposit-row">
        <span>الحالة</span>
        <strong>${item.status || "-"}</strong>
      </div>

      <div class="deposit-row">
        <span>التاريخ</span>
        <strong>${formatDate(item.created_at)}</strong>
      </div>
    </div>
  `).join("");
}

async function loadCodes(profile) {
  const { data, error } = await supabaseClient
    .from("code_usage")
    .select(`
      *,
      daily_codes(code)
    `)
    .eq("user_id", profile.id)
    .order("used_at", { ascending: false });

  if (error || !data || !data.length) {
    codesHistory.innerHTML = `<p class="note">لا توجد أكواد مستخدمة</p>`;
    return;
  }

  codesHistory.innerHTML = data.map(item => `
    <div class="deposit-item">
      <div class="deposit-row">
        <span>الكود</span>
        <strong>${item.daily_codes?.code || "-"}</strong>
      </div>

      <div class="deposit-row">
        <span>القيمة المضافة</span>
        <strong>${formatMoney(item.profit_added)} دولار</strong>
      </div>

      <div class="deposit-row">
        <span>التاريخ</span>
        <strong>${formatDate(item.used_at)}</strong>
      </div>
    </div>
  `).join("");
}

window.addEventListener("DOMContentLoaded", async () => {
  const profile = await getCurrentProfile();
  if (!profile) return;

  await loadDeposits(profile);
  await loadWithdrawals(profile);
  await loadCodes(profile);
});
