const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

const urlParams = new URLSearchParams(window.location.search);
const ref = urlParams.get("ref");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    registerMessage.textContent = "جاري إنشاء الحساب...";

    const fullName = document.getElementById("full_name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm_password").value;

    if (password !== confirmPassword) {
      registerMessage.textContent = "كلمتا المرور غير متطابقتين";
      return;
    }

    if (password.length < 6) {
      registerMessage.textContent = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
      return;
    }

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
      });

      if (error) {
        registerMessage.textContent = "تعذر إنشاء الحساب";
        console.error(error);
        return;
      }

      if (!data?.user) {
        registerMessage.textContent = "تعذر إنشاء الحساب";
        return;
      }

      const isAdmin = email === "am.alsus1995@gmail.com";

      const { error: insertError } = await supabaseClient
        .from("users")
        .insert([
          {
            auth_user_id: data.user.id,
            full_name: fullName,
            email: email,
            role: isAdmin ? "admin" : "user",
            balance: 0,
            total_profit: 0,
            available_withdraw: 0,
            referral_count: 0,
            charged_referrals_count: 0,
            referral_profit: 0,
            team_reward_paid: false,
            is_telegram_linked: false,
            is_verified: false,
            is_active: true,
            referred_by: ref || null
          }
        ]);

      if (insertError) {
        console.error(insertError);
      }

      registerMessage.textContent = "تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن.";
      registerForm.reset();
    } catch (err) {
      console.error(err);
      registerMessage.textContent = "حدث خطأ أثناء إنشاء الحساب";
    }
  });
}
