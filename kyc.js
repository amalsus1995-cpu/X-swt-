const kycStatusBox = document.getElementById("kycStatusBox");
const kycForm = document.getElementById("kycForm");
const kycMessage = document.getElementById("kycMessage");

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ar-EG");
}

function getStatusLabel(status) {
  switch (status) {
    case "approved":
      return "مقبول";
    case "rejected":
      return "مرفوض";
    case "pending":
      return "قيد المراجعة";
    default:
      return "غير معروف";
  }
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

async function loadKyc(profile) {
  const { data, error } = await supabaseClient
    .from("kyc_requests")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || !data.length) {
    kycStatusBox.innerHTML = `<p class="note">لا يوجد طلب توثيق حتى الآن</p>`;
    return;
  }

  const item = data[0];

  kycStatusBox.innerHTML = `
    <div class="deposit-item">
      <div class="deposit-row">
        <span>الحالة</span>
        <strong>${getStatusLabel(item.status)}</strong>
      </div>

      <div class="deposit-row">
        <span>الاسم</span>
        <strong>${item.full_name || "-"}</strong>
      </div>

      <div class="deposit-row">
        <span>الدولة</span>
        <strong>${item.country || "-"}</strong>
      </div>

      <div class="deposit-row">
        <span>رقم الهوية</span>
        <strong>${item.id_number || "-"}</strong>
      </div>

      <div class="deposit-row">
        <span>التاريخ</span>
        <strong>${formatDate(item.created_at)}</strong>
      </div>
    </div>
  `;
}

window.addEventListener("DOMContentLoaded", async () => {
  const profile = await getCurrentProfile();
  if (!profile) return;

  await loadKyc(profile);

  kycForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    kycMessage.textContent = "جاري إرسال الطلب...";

    const full_name = document.getElementById("kycFullName").value.trim();
    const country = document.getElementById("kycCountry").value.trim();
    const id_number = document.getElementById("kycIdNumber").value.trim();
    const front_image_url = document.getElementById("frontImageUrl").value.trim();
    const back_image_url = document.getElementById("backImageUrl").value.trim();
    const selfie_image_url = document.getElementById("selfieImageUrl").value.trim();

    const { error } = await supabaseClient
      .from("kyc_requests")
      .insert([
        {
          user_id: profile.id,
          full_name,
          country,
          id_number,
          front_image_url,
          back_image_url,
          selfie_image_url,
          status: "pending"
        }
      ]);

    if (error) {
      console.error(error);
      kycMessage.textContent = "فشل إرسال الطلب";
      return;
    }

    kycMessage.textContent = "تم إرسال طلب التوثيق بنجاح";
    kycForm.reset();
    await loadKyc(profile);
  });
});
