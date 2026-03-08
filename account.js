const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const avatarLetter = document.getElementById("avatarLetter");
const userUid = document.getElementById("userUid");
const userRole = document.getElementById("userRole");

const balanceValue = document.getElementById("balanceValue");
const profitValue = document.getElementById("profitValue");
const withdrawValue = document.getElementById("withdrawValue");
const referralProfitValue = document.getElementById("referralProfitValue");

const logoutBtn = document.getElementById("logoutBtn");
const adminPanelLink = document.getElementById("adminPanelLink");

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

async function loadAccount() {
  const { data: auth } = await supabaseClient.auth.getUser();

  if (!auth?.user) {
    window.location.href = "login.html";
    return;
  }

  const { data: profile, error } = await supabaseClient
    .from("users")
    .select("*")
    .eq("auth_user_id", auth.user.id)
    .single();

  if (error || !profile) {
    console.error(error);
    window.location.href = "login.html";
    return;
  }

  userName.textContent = profile.full_name || "مستخدم";
  userEmail.textContent = profile.email || "-";
  avatarLetter.textContent = (profile.full_name || "U").trim().charAt(0).toUpperCase();
  userUid.textContent = `UID: ${profile.uid || "--"}`;
  userRole.textContent = (profile.role || "user").toUpperCase();

  balanceValue.textContent = formatMoney(profile.balance);
  profitValue.textContent = formatMoney(profile.total_profit);
  withdrawValue.textContent = formatMoney(profile.available_withdraw);
  referralProfitValue.textContent = formatMoney(profile.referral_profit);

  if (profile.role === "admin") {
    adminPanelLink.style.display = "block";
  }
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    await supabaseClient.auth.signOut();
    localStorage.removeItem("user_profile");
    window.location.href = "login.html";
  });
}

loadAccount();
