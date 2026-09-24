import { renderCertificateEmail } from "../templates"

describe("renderCertificateEmail", () => {
  const base = {
    learner_name: "Ada Lovelace",
    course_title: "HIPAA Training",
    certificate_code: "CERT-20260101-ABC123",
    issued_at: "2026-01-01T00:00:00.000Z",
    expires_at: "2027-01-01T00:00:00.000Z",
    verify_url: "https://example.com/verify?code=CERT-20260101-ABC123",
  }

  it("includes the course, code and verification link", () => {
    const email = renderCertificateEmail(base)
    expect(email.subject).toBe("Your certificate for HIPAA Training")
    expect(email.html).toContain("CERT-20260101-ABC123")
    expect(email.html).toContain(base.verify_url)
    expect(email.text).toContain("Valid until")
  })

  it("mentions certificates that never expire", () => {
    const email = renderCertificateEmail({ ...base, expires_at: null })
    expect(email.text).toContain("does not expire")
  })

  it("escapes user-provided values in the HTML", () => {
    const email = renderCertificateEmail({ ...base, learner_name: "<script>x</script>" })
    expect(email.html).not.toContain("<script>")
    expect(email.html).toContain("&lt;script&gt;")
  })
})
