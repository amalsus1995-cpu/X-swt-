const codeForm = document.getElementById("codeForm");
const codeInput = document.getElementById("codeInput");
const codeMessage = document.getElementById("codeMessage");
const codesHistory = document.getElementById("codesHistory");

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

async function loadHistory(profile) {
  const { data, error } = await supabaseClient
    .from("code_usage")
    .select(`
      *,
      daily_codes(code)
    `)
    .eq("user_id", profile.id)
    .order("used_at", { ascending: false });

  if (error || !data || !data.length) {
    codesHistory.innerHTML = `<p class="note">لا توجد أكواد مستخدمة بعد</p>`;
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
        <strong>${item.profit_added || 0}</strong>
      </div>
      <div class="deposit-row">
        <span>التاريخ</span>
        <strong>${new Date(item.used_at).toLocaleString("ar-EG")}</strong>
      </div>
    </div>
  `).join("");
}

if (codeForm) {
  codeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    codeMessage.textContent = "جاري التحقق من الكود...";

    const profile = await getCurrentProfile();
    if (!profile) return;

    const enteredCode = codeInput.value.trim();

    const { data: codeRow, error: codeError } = await supabaseClient
      .from("daily_codes")
      .select("*")
      .eq("code", enteredCode)
      .eq("is_active", true)
      .single();

    if (codeError || !codeRow) {
      codeMessage.textContent = "الكود غير صحيح أو غير مفعل";
      return;
    }

    const { data: alreadyUsed } = await supabaseClient
      .from("code_usage")
      .select("*")
      .eq("user_id", profile.id)
      .eq("code_id", codeRow.id)
      .maybeSingle();

    if (alreadyUsed) {
      codeMessage.textContent = "لقد استخدمت هذا الكود مسبقًا";
      return;
    }

    const rewardValue = 5; // قيمة داخلية ثابتة كمثال آمن
    const newBalance = Number(profile.balance || 0) + rewardValue;

    const { error: updateError } = await supabaseClient
      .from("users")
      .update({
        balance: newBalance,
        total_profit: Number(profile.total_profit || 0) + rewardValue
      })
      .eq("id", profile.id);

    if (updateError) {
      codeMessage.textContent = "فشل تحديث الرصيد";
      return;
    }

    const { error: usageError } = await supabaseClient
      .from("code_usage")
      .insert([
        {
          user_id: profile.id,
          code_id: codeRow.id,
          balance_before: Number(profile.balance || 0),
          profit_added: rewardValue,
          balance_after: newBalance
        }
      ]);

    if (usageError) {
      codeMessage.textContent = "تم التفعيل لكن فشل حفظ العملية";
      return;
    }

    codeMessage.textContent = `تم تفعيل الكود وإضافة ${rewardValue} إلى حسابك`;
    codeForm.reset();
    await loadHistory({ ...profile, balance: newBalance });
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  const profile = await getCurrentProfile();
  if (!profile) return;
  await loadHistory(profile);
});
