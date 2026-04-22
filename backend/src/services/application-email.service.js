const { sendTemplatedEmail, renderBrandedEmail } = require("./email.service");

const statusLabels = {
  received: "Application Received",
  under_review: "Under Review",
  interview_scheduled: "Interview Scheduled",
  reserved: "Reserved",
  adopted: "Adopted",
  rejected: "Rejected",
};

async function sendApplicationStatusEmail({ to, petName, status, dashboardUrl }) {
  const label = statusLabels[status] || status;
  const html = renderBrandedEmail({
    preheader: `Application status update: ${label}`,
    heading: label,
    intro: `Your adoption application for ${petName} has been updated.`,
    body: `<p style=\"margin:0 0 18px;color:#334155;font-size:15px;line-height:1.7;\">Current status: <strong>${label}</strong></p>`,
    ctaLabel: "View Dashboard",
    ctaUrl: dashboardUrl,
  });

  return sendTemplatedEmail({
    to,
    subject: `Pet Care application update: ${label}`,
    fallbackLabel: `Application status email (${label}) for ${petName}`,
    html,
  });
}

module.exports = {
  sendApplicationStatusEmail,
};
