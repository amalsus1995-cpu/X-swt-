const referralLinkEl = document.getElementById("referralLink");
const copyReferralBtn = document.getElementById("copyReferralBtn");
const referralCountValue = document.getElementById("referralCountValue");
const chargedReferralsValue = document.getElementById("chargedReferralsValue");
const referralProfitValue = document.getElementById("referralProfitValue");
const teamRewardStatus = document.getElementById("teamRewardStatus");
const teamList = document.getElementById("teamList");

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

function buildReferralLink(profile) {
  const code = profile.referral_code || profile.uid || "";
  return `${window.location.origin}/register.html?ref=${code}`;
}

async function loadTeam(profile) {
  const referralKey = profile.referral_code || String(profile.uid || "");

  const { data, error } = await supabaseClient
    .from("users")
    .select("full_name,email,created_at,balance,available_withdraw")
    .eq("referred_by", referralKey)
    .order("created_at", { ascending: false });

  if (error) {
    teamList.innerHTML = `<p class="note">تعذر تحميل الفريق</p>`;
    return;
  }

  const teamMembers = data || [];
  const chargedMembers = teamMembers.filter(member => Number(member.balance || 0) >= 500);

  referralCountValue.textContent = teamMembers.length;
  chargedReferralsValue.textContent = chargedMembers.length;
  referralProfitValue.textContent = formatMoney(profile.referral_profit || 0);
  teamRewardStatus.textContent = `${chargedMembers.length} / 12`;

  if (!teamMembers.length) {
    teamList.innerHTML = `<p class="note">لا يوجد أعضاء في فريقك حتى الآن</p>`;
    return;
  }

  teamList.innerHTML = teamMembers.map(member => {
    const isCharged = Number(member.balance || 0) >= 500;

    return `
      <div class="deposit-item">
        <div class="deposit-row">
          <span>الاسم</span>
          <strong>${member.full_name || "مستخدم"}</strong>
        </div>

        <div class="deposit-row">
          <span>الإيميل</span>
          <strong class="txid-text">${member.email || "-"}</strong>
        </div>

        <div class="deposit-row">
          <span>الرصيد</span>
          <strong>${formatMoney(member.balance || 0)} دولار</strong>
        </div>

        <div class="deposit-row">
          <span>الحالة</span>
          <strong>${isCharged ? "شحن 500 أو أكثر" : "لم يكتمل الشرط"}</strong>
        </div>

        <div class="deposit-row">
          <span>تاريخ التسجيل</span>
          <strong>${new Date(member.created_at).toLocaleDateString("ar-EG")}</strong>
        </div>
      </div>
    `;
  }).join("");
}

window.addEventListener("DOMContentLoaded", async () => {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const referralLink = buildReferralLink(profile);
  referralLinkEl.textContent = referralLink;

  copyReferralBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      copyReferralBtn.textContent = "تم النسخ ✔";
      setTimeout(() => {
        copyReferralBtn.textContent = "نسخ الرابط";
      }, 2000);
    } catch {
      copyReferralBtn.textContent = "فشل النسخ";
    }
  });

  await loadTeam(profile);
});
