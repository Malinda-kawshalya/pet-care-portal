const { sendTemplatedEmail, renderBrandedEmail } = require("./email.service");

async function sendGenericNotificationEmail({
  to,
  recipientName,
  title,
  message,
  ctaUrl = "",
}) {
  const html = renderBrandedEmail({
    preheader: "New notification from PetAI",
    heading: title,
    intro: recipientName
      ? `Hello ${recipientName}, we have a quick update for you.`
      : "We have a quick update for you.",
    body: `<p style=\"margin:0 0 18px;color:#334155;font-size:15px;line-height:1.7;\">${message}</p>`,
    ctaLabel: ctaUrl ? "Open Dashboard" : "",
    ctaUrl,
    footerNote: "You can manage notification preferences from your account settings.",
  });

  return sendTemplatedEmail({
    to,
    subject: `PetAI Notification: ${title}`,
    html,
    fallbackLabel: `Notification email for ${to}`,
  });
}

module.exports = {
  sendGenericNotificationEmail,
};
