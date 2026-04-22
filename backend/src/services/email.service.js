const nodemailer = require("nodemailer");
const env = require("../config/env");

function renderBrandedEmail({
  preheader = "PetAI update",
  heading,
  intro = "",
  body = "",
  ctaLabel = "",
  ctaUrl = "",
  footerNote = "",
}) {
  const safeCta = ctaLabel && ctaUrl;

  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <div style="margin:0;padding:26px;background:linear-gradient(180deg,#eef4ff 0%,#ffffff 100%);font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dbe7ff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(47,102,255,0.12);">
        <div style="padding:20px 24px;background:#2f66ff;color:#ffffff;">
          <h1 style="margin:0;font-size:20px;line-height:1.2;">PetAI</h1>
          <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">AI-powered pet care and adoption portal</p>
        </div>
        <div style="padding:24px;">
          <h2 style="margin:0 0 12px;font-size:22px;color:#0f172a;">${heading}</h2>
          ${intro ? `<p style=\"margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;\">${intro}</p>` : ""}
          ${body}
          ${
            safeCta
              ? `<p style=\"margin:22px 0 0;\"><a href=\"${ctaUrl}\" style=\"display:inline-block;padding:11px 16px;background:#2f66ff;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;\">${ctaLabel}</a></p>`
              : ""
          }
        </div>
        <div style="padding:14px 24px;background:#f8fbff;border-top:1px solid #e2ebff;color:#64748b;font-size:12px;line-height:1.6;">
          ${footerNote || "PetAI automated message. Please do not reply to this email."}
        </div>
      </div>
    </div>
  `;
}

function createTransport() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

async function sendPasswordResetEmail({ to, resetLink }) {
  const html = renderBrandedEmail({
    preheader: "Password reset request",
    heading: "Reset your password",
    intro: "We received a request to reset your PetAI account password.",
    body: "<p style=\"margin:0 0 18px;color:#334155;font-size:15px;line-height:1.7;\">For security, this link expires in 30 minutes.</p>",
    ctaLabel: "Reset Password",
    ctaUrl: resetLink,
    footerNote: "If you did not request this reset, you can safely ignore this email.",
  });

  return sendTemplatedEmail({
    to,
    subject: "Reset your Pet Care account password",
    html,
    fallbackLabel: `Password reset link for ${to}`,
  });
}

async function sendTemplatedEmail({ to, subject, html, fallbackLabel }) {
  const transport = createTransport();

  if (!transport) {
    console.log(`${fallbackLabel} sent to ${to}`);
    return;
  }

  await transport.sendMail({
    from: env.EMAIL_FROM || "no-reply@petcare.local",
    to,
    subject,
    html,
  });
}

module.exports = { sendPasswordResetEmail, sendTemplatedEmail, renderBrandedEmail };
