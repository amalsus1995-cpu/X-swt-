const balanceValue = document.getElementById("balanceValue");
const profitValue = document.getElementById("profitValue");
const withdrawValue = document.getElementById("withdrawValue");
const teamCountValue = document.getElementById("teamCountValue");
const welcomeText = document.getElementById("welcomeText");

const walletAddress = document.getElementById("walletAddress");
const copyWalletBtn = document.getElementById("copyWalletBtn");

async function loadDashboard() {

  const { data: auth } = await supabaseClient.auth.getUser();

  if (!auth || !auth.user) {
    window.location.href = "login.html";
    return;
  }

  const { data: profile, error } = await supabaseClient
    .from("users")
    .select("*")
    .eq("auth_user_id", auth.user.id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  if (welcomeText) {
    welcomeText.textContent = "مرحبًا " + (profile.full_name || "بك");
  }

  if (balanceValue) {
    balanceValue.textContent = profile.balance || 0;
  }

  if (profitValue) {
    profitValue.textContent = profile.total_profit || 0;
  }

  if (withdrawValue) {
    withdrawValue.textContent = profile.available_withdraw || 0;
  }

  if (teamCountValue) {
    teamCountValue.textContent = profile.referral_count || 0;
  }
}

if (copyWalletBtn) {

  copyWalletBtn.addEventListener("click", () => {

    const text = walletAddress.textContent;

    navigator.clipboard.writeText(text);

    copyWalletBtn.textContent = "تم النسخ ✔";

    setTimeout(() => {
      copyWalletBtn.textContent = "نسخ العنوان";
    }, 2000);

  });

}

loadDashboard();
