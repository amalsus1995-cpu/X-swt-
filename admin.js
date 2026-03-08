const usersCount = document.getElementById("usersCount");
const codesCount = document.getElementById("codesCount");
const depositsCount = document.getElementById("depositsCount");
const withdrawalsCount = document.getElementById("withdrawalsCount");

const newCodeInput = document.getElementById("newCodeInput");
const createCodeBtn = document.getElementById("createCodeBtn");
const createCodeMessage = document.getElementById("createCodeMessage");

const codesList = document.getElementById("codesList");
const usersList = document.getElementById("usersList");
const userSearch = document.getElementById("userSearch");

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

async function getAdminProfile() {
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

  if (profile.role !== "admin") {
    window.location.href = "account.html";
    return null;
  }

  return profile;
}

async function loadStats() {
  const [
    usersResult,
    codesResult,
    depositsResult,
    withdrawalsResult
  ] = await Promise.all([
    supabaseClient.from("users").select("*", { count: "exact", head: true }),
    supabaseClient.from("daily_codes").select("*", { count: "exact", head: true }),
    supabaseClient.from("deposits").select("*", { count: "exact", head: true }),
    supabaseClient.from("withdrawals").select("*", { count: "exact", head: true })
  ]);

  usersCount.textContent = usersResult.count || 0;
  codesCount.textContent = codesResult.count || 0;
  depositsCount.textContent = depositsResult.count || 0;
  withdrawalsCount.textContent = withdrawalsResult.count || 0;
}

async function loadCodes() {
  const { data, error } = await supabaseClient
    .from("daily_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data || !data.length) {
    codesList.innerHTML = `<p class="note">لا توجد أكواد حالياً</p>`;
    return;
  }

  codesList.innerHTML = data.map(code => `
    <div class="admin-card">
      <div class="admin-card-top">
        <div>
          <h3>${code.code}</h3>
          <p>${new Date(code.created_at).toLocaleString("ar-EG")}</p>
        </div>
        <span class="mini-badge">${code.is_active ? "نشط" : "متوقف"}</span>
      </div>

      <div class="admin-actions">
        <button class="small-btn" onclick="toggleCode('${code.id}', ${code.is_active})">
          ${code.is_active ? "إيقاف" : "تفعيل"}
        </button>
      </div>
    </div>
  `).join("");
}

async function createCode() {
  const code = newCodeInput.value.trim();

  if (!code) {
    createCodeMessage.textContent = "أدخل الكود أولاً";
    return;
  }

  const { error } = await supabaseClient
    .from("daily_codes")
    .insert([
      {
        code,
        is_active: true
      }
    ]);

  if (error) {
    console.error(error);
    createCodeMessage.textContent = "فشل إنشاء الكود";
    return;
  }

  createCodeMessage.textContent = "تم إنشاء الكود بنجاح";
  newCodeInput.value = "";
  await loadCodes();
  await loadStats();
}

async function toggleCode(codeId, currentStatus) {
  const { error } = await supabaseClient
    .from("daily_codes")
    .update({
      is_active: !currentStatus
    })
    .eq("id", codeId);

  if (error) {
    alert("فشل تحديث حالة الكود");
    return;
  }

  await loadCodes();
}

async function loadUsers() {
  const { data, error } = await supabaseClient
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data || !data.length) {
    usersList.innerHTML = `<p class="note">لا يوجد مستخدمون</p>`;
    return;
  }

  renderUsers(data);
}

function renderUsers(users) {
  usersList.innerHTML = users.map(user => `
    <div class="admin-card" data-user-card>
      <div class="admin-card-top">
        <div>
          <h3>${user.full_name || "مستخدم"}</h3>
          <p>${user.email || "-"}</p>
        </div>
        <span class="mini-badge">${(user.role || "user").toUpperCase()}</span>
      </div>

      <div class="deposit-row">
        <span>UID</span>
        <strong>${user.uid || "--"}</strong>
      </div>

      <div class="deposit-row">
        <span>الرصيد</span>
        <strong>${formatMoney(user.balance)} دولار</strong>
      </div>

      <div class="deposit-row">
        <span>أرباح الإحالات</span>
        <strong>${formatMoney(user.referral_profit)} دولار</strong>
      </div>

      <div class="deposit-row">
        <span>عدد الفريق</span>
        <strong>${user.referral_count || 0}</strong>
      </div>

      <div class="admin-actions">
        <button class="small-btn" onclick="changeBalance('${user.id}', ${Number(user.balance || 0)}, 'add')">
          زيادة رصيد
        </button>

        <button class="small-btn danger-btn" onclick="changeBalance('${user.id}', ${Number(user.balance || 0)}, 'subtract')">
          خصم رصيد
        </button>
      </div>
    </div>
  `).join("");
}

async function changeBalance(userId, currentBalance, mode) {
  const amountText = prompt(mode === "add" ? "كم تريد زيادة الرصيد؟" : "كم تريد خصم الرصيد؟");

  if (!amountText) return;

  const amount = parseFloat(amountText);

  if (isNaN(amount) || amount <= 0) {
    alert("أدخل مبلغ صحيح");
    return;
  }

  let newBalance = currentBalance;

  if (mode === "add") {
    newBalance += amount;
  } else {
    newBalance -= amount;
    if (newBalance < 0) newBalance = 0;
  }

  const { error } = await supabaseClient
    .from("users")
    .update({
      balance: newBalance
    })
    .eq("id", userId);

  if (error) {
    alert("فشل تعديل الرصيد");
    return;
  }

  alert("تم تعديل الرصيد");
  await loadUsers();
}

function enableUserSearch() {
  userSearch.addEventListener("input", () => {
    const term = userSearch.value.trim().toLowerCase();
    const cards = document.querySelectorAll("[data-user-card]");

    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(term) ? "block" : "none";
    });
  });
}

window.toggleCode = toggleCode;
window.changeBalance = changeBalance;

window.addEventListener("DOMContentLoaded", async () => {
  const admin = await getAdminProfile();
  if (!admin) return;

  await loadStats();
  await loadCodes();
  await loadUsers();
  enableUserSearch();

  createCodeBtn.addEventListener("click", createCode);
});
