const transactionPasswordForm = document.getElementById("transactionPasswordForm");
const transactionPasswordMessage = document.getElementById("transactionPasswordMessage");

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

window.addEventListener("DOMContentLoaded", async () => {
  const profile = await getCurrentProfile();
  if (!profile) return;

  transactionPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    transactionPasswordMessage.textContent = "جاري الحفظ...";

    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      transactionPasswordMessage.textContent = "كلمتا المرور غير متطابقتين";
      return;
    }

    if (profile.transaction_password && profile.transaction_password !== oldPassword) {
      transactionPasswordMessage.textContent = "كلمة المرور الحالية غير صحيحة";
      return;
    }

    const { error } = await supabaseClient
      .from("users")
      .update({
        transaction_password: newPassword
      })
      .eq("id", profile.id);

    if (error) {
      console.error(error);
      transactionPasswordMessage.textContent = "فشل حفظ كلمة المرور";
      return;
    }

    transactionPasswordMessage.textContent = "تم حفظ كلمة مرور المعاملة بنجاح";
    transactionPasswordForm.reset();
  });
});
