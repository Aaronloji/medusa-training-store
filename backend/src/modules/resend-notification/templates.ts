export type CertificateEmailData = {
  learner_name: string
  course_title: string
  certificate_code: string
  issued_at: string
  expires_at?: string | null
  verify_url: string
}

export type RenderedEmail = { subject: string; html: string; text: string }

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

export function renderCertificateEmail(data: CertificateEmailData): RenderedEmail {
  const validity = data.expires_at
    ? `Valid until ${formatDate(data.expires_at)}`
    : "This certificate does not expire"
  const name = escapeHtml(data.learner_name)
  const course = escapeHtml(data.course_title)
  const code = escapeHtml(data.certificate_code)
  const url = escapeHtml(data.verify_url)

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f6f8f7;font-family:Arial,Helvetica,sans-serif;color:#0b1f2a">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px">
          <tr><td>
            <p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:3px;color:#8a6411">CERTIFICATE OF COMPLETION</p>
            <h1 style="margin:16px 0 8px;font-size:24px">Congratulations, ${name}!</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#3d5361">You completed <strong>${course}</strong>.</p>
            <table role="presentation" width="100%" style="background:#f6f8f7;border-radius:12px;padding:16px">
              <tr><td style="font-size:14px;color:#6b7f8c">Certificate code</td>
                  <td align="right" style="font-family:monospace;font-size:14px;font-weight:bold">${code}</td></tr>
              <tr><td style="font-size:14px;color:#6b7f8c;padding-top:8px">Issued</td>
                  <td align="right" style="font-size:14px;padding-top:8px">${formatDate(data.issued_at)}</td></tr>
              <tr><td colspan="2" style="font-size:14px;color:#6b7f8c;padding-top:8px">${validity}</td></tr>
            </table>
            <p style="margin:24px 0 0">
              <a href="${url}" style="display:inline-block;background:#07855a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px">Verify certificate</a>
            </p>
            <p style="margin:24px 0 0;font-size:12px;color:#6b7f8c">Share the verification link with your employer as proof of training.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`

  const text = [
    `Congratulations, ${data.learner_name}!`,
    `You completed ${data.course_title}.`,
    `Certificate code: ${data.certificate_code}`,
    `Issued: ${formatDate(data.issued_at)}`,
    validity,
    `Verify: ${data.verify_url}`,
  ].join("\n")

  return { subject: `Your certificate for ${data.course_title}`, html, text }
}

export const TEMPLATES: Record<string, (data: any) => RenderedEmail> = {
  "certificate-issued": renderCertificateEmail,
}
