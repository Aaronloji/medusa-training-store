import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { createAdminToken, createStoreFixture, settle } from "../helpers"

jest.setTimeout(120 * 1000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let fixture: Awaited<ReturnType<typeof createStoreFixture>>
    let adminHeaders: Record<string, string>

    beforeEach(async () => {
      const container = getContainer()
      fixture = await createStoreFixture(container)
      adminHeaders = await createAdminToken(container, api)
    })

    describe("GET /store/courses", () => {
      it("lists published courses with region pricing and without paid content", async () => {
        const { status, data } = await api.get(
          `/store/courses?region_id=${fixture.region.id}`,
          { headers: { "x-publishable-api-key": fixture.publishableKey } }
        )

        expect(status).toBe(200)
        expect(data.courses).toHaveLength(1)
        const [course] = data.courses
        expect(course.product.variants[0].calculated_price.calculated_amount).toBe(40)
        expect(course.lessons[0]).not.toHaveProperty("content_url")
      })

      it("requires a publishable API key", async () => {
        const res = await settle(api.get("/store/courses"))
        expect(res.status).toBe(400)
      })
    })

    describe("Admin course management", () => {
      it("validates the payload when creating a course", async () => {
        const res = await settle(
          api.post("/admin/courses", { handle: "Not A Handle" }, { headers: adminHeaders })
        )
        expect(res.status).toBe(400)
      })

      it("creates a draft course that stays hidden from the storefront", async () => {
        const created = await api.post(
          "/admin/courses",
          {
            handle: "fire-safety",
            title: "Fire Safety",
            lessons: [{ title: "Extinguishers", duration_minutes: 15 }],
          },
          { headers: adminHeaders }
        )
        expect(created.status).toBe(201)
        expect(created.data.course.lessons).toHaveLength(1)

        const store = await settle(
          api.get("/store/courses/fire-safety", {
            headers: { "x-publishable-api-key": fixture.publishableKey },
          })
        )
        expect(store.status).toBe(404)
      })

      it("updates a course through the update-course workflow", async () => {
        const { data } = await api.post(
          `/admin/courses/${fixture.course.id}`,
          { title: "HIPAA Essentials", certificate_validity_days: 730 },
          { headers: adminHeaders }
        )
        expect(data.course.title).toBe("HIPAA Essentials")
        expect(data.course.certificate_validity_days).toBe(730)
      })

      it("returns 404 when updating a missing course", async () => {
        const res = await settle(
          api.post("/admin/courses/course_missing", { title: "x" }, { headers: adminHeaders })
        )
        expect(res.status).toBe(404)
      })
    })
  },
})
