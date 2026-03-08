const balanceValue = document.getElementById("balanceValue");
const availableWithdrawValue = document.getElementById("availableWithdrawValue");
const withdrawPreviewForm = document.getElementById("withdrawPreviewForm");
const withdrawMessage = document.getElementById("withdrawMessage");
const withdrawPreviewBox = document.getElementById("withdrawPreviewBox");

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
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

function fillBalances(profile) {
  balanceValue.textContent = formatMoney(profile.balance || 0);
  availableWithdrawValue.textContent = formatMoney(profile.available_withdraw || 0);
}

function renderPreview(amount, wallet) {
  withdrawPreviewBox.innerHTML = `
    <div class="deposit-item">
      <div class="deposit-row">
        <span>المبلغ</span>
        <strong>${formatMoney(amount)} دولار</strong>
      </div>

      <div class="deposit-row">
        <span>الشبكة</span>
        <strong>TRC20</strong>
      </div>

      <div class="deposit-row">
        <span>المحفظة</span>
        <strong class="txid-text">${wallet}</strong>
      </div>

      <div class="deposit-row">
        <span>الحالة</span>
        <strong>معاينة فقط</strong>
      </div>
    </div>
  `;
}

window.addEventListener("DOMContentLoaded", async () => {
  const profile = await getCurrentProfile();
  if (!profile) return;

  fillBalances(profile);

  withdrawPreviewForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const amount = Number(document.getElementById("withdrawAmount").value);
    const wallet = document.getElementById("withdrawWallet").value.trim();
    const password = document.getElementById("transactionPassword").value.trim();

    if (!amount || amount <= 0) {
      withdrawMessage.textContent = "أدخل مبلغ صحيح";
      return;
    }

    if (!wallet) {
      withdrawMessage.textContent = "أدخل عنوان المحفظة";
      return;
    }

    if (!password) {
      withdrawMessage.textContent = "أدخل كلمة مرور المعاملة";
      return;
    }

    withdrawMessage.textContent = "تمت المعاينة بنجاح";
    renderPreview(amount, wallet);
  });
});
