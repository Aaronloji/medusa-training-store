import { Modules } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  checkout,
  createCustomerHeaders,
  createStoreFixture,
  settle,
  waitFor,
} from "../helpers"

jest.setTimeout(120 * 1000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let fixture: Awaited<ReturnType<typeof createStoreFixture>>
    let headers: Record<string, string>

    const getEnrollments = async (h = headers) =>
      (await api.get("/store/customers/me/enrollments", { headers: h })).data.enrollments

    beforeEach(async () => {
      fixture = await createStoreFixture(getContainer())
      headers = await createCustomerHeaders(api, fixture.publishableKey, "learner@test.com")
    })

    it("enrolls the customer when the order is placed (order.placed subscriber)", async () => {
      const res = await checkout(api, headers, fixture.region.id, fixture.variantId)
      expect(res.data.type).toBe("order")

      const [enrollment] = await waitFor(async () => {
        const enrollments = await getEnrollments()
        return enrollments.length ? enrollments : null
      })
      expect(enrollment.status).toBe("active")
      expect(enrollment.course.id).toBe(fixture.course.id)
      // Enrolled learners can access the paid lesson content.
      expect(enrollment.course.lessons[0]).toHaveProperty("content_url")
    })

    it("tracks progress, issues a verifiable certificate and sends notifications", async () => {
      await checkout(api, headers, fixture.region.id, fixture.variantId)
      const [enrollment] = await waitFor(async () => {
        const e = await getEnrollments()
        return e.length ? e : null
      })

      const first = await api.post(
        `/store/customers/me/enrollments/${enrollment.id}/complete-lesson`,
        { lesson_id: fixture.lessonIds[0] },
        { headers }
      )
      expect(first.data.enrollment.progress_percent).toBe(50)

      const last = await api.post(
        `/store/customers/me/enrollments/${enrollment.id}/complete-lesson`,
        { lesson_id: fixture.lessonIds[1] },
        { headers }
      )
      const { certificate_code, status, expires_at } = last.data.enrollment
      expect(status).toBe("completed")
      expect(certificate_code).toMatch(/^CERT-\d{8}-[0-9A-F]{6}$/)
      expect(expires_at).toBeTruthy()

      const { data } = await api.get(`/store/certificates/${certificate_code}`, {
        headers: { "x-publishable-api-key": fixture.publishableKey },
      })
      expect(data.certificate).toMatchObject({ valid: true, holder: "Test Learner" })

      // enrollment.completed → workflow → email (Resend provider) + admin feed (local provider)
      const notificationService = getContainer().resolve(Modules.NOTIFICATION)
      const notifications = await waitFor(async () => {
        const list = await notificationService.listNotifications({})
        return list.length >= 2 ? list : null
      })
      expect(notifications.map((n) => n.channel).sort()).toEqual(["email", "feed"])
      expect(notifications.find((n) => n.channel === "email")).toMatchObject({
        to: "learner@test.com",
        template: "certificate-issued",
      })
    })

    it("blocks buying a course the customer already owns (workflow hooks)", async () => {
      await checkout(api, headers, fixture.region.id, fixture.variantId)
      await waitFor(async () => ((await getEnrollments()).length ? true : null))

      // addToCartWorkflow.hooks.validate
      const {
        data: { cart },
      } = await api.post("/store/carts", { region_id: fixture.region.id }, { headers })
      const addToCart = await settle(
        api.post(
          `/store/carts/${cart.id}/line-items`,
          { variant_id: fixture.variantId, quantity: 1 },
          { headers }
        )
      )
      expect(addToCart.status).toBe(400)
      expect(addToCart.data.message).toContain("already have access")

      // createCartWorkflow.hooks.validate (the storefront creates the cart with its items)
      const newCart = await settle(
        api.post(
          "/store/carts",
          { region_id: fixture.region.id, items: [{ variant_id: fixture.variantId, quantity: 1 }] },
          { headers }
        )
      )
      expect(newCart.status).toBe(400)
      expect(newCart.data.message).toContain("already have access")
    })

    it("still blocks the order at completion when an owned course reaches checkout", async () => {
      // A guest cart gets the item first, then the customer logs in and completes it.
      const keyHeader = { "x-publishable-api-key": fixture.publishableKey }
      const {
        data: { cart },
      } = await api.post(
        "/store/carts",
        { region_id: fixture.region.id, items: [{ variant_id: fixture.variantId, quantity: 1 }] },
        { headers: keyHeader }
      )

      await checkout(api, headers, fixture.region.id, fixture.variantId)
      await waitFor(async () => ((await getEnrollments()).length ? true : null))

      await api.post(`/store/carts/${cart.id}/customer`, {}, { headers })
      const {
        data: { payment_collection },
      } = await api.post("/store/payment-collections", { cart_id: cart.id }, { headers })
      await api.post(
        `/store/payment-collections/${payment_collection.id}/payment-sessions`,
        { provider_id: "pp_system_default" },
        { headers }
      )
      const res = await settle(api.post(`/store/carts/${cart.id}/complete`, {}, { headers }))
      // completeCartWorkflow.hooks.validate rejects it: no second order is created.
      expect(res.data.type).not.toBe("order")
      expect(await getEnrollments()).toHaveLength(1)
    })

    it("does not let a customer touch another customer's enrollment", async () => {
      await checkout(api, headers, fixture.region.id, fixture.variantId)
      const [enrollment] = await waitFor(async () => {
        const e = await getEnrollments()
        return e.length ? e : null
      })

      const intruder = await createCustomerHeaders(api, fixture.publishableKey, "other@test.com")
      const res = await settle(
        api.post(
          `/store/customers/me/enrollments/${enrollment.id}/complete-lesson`,
          { lesson_id: fixture.lessonIds[0] },
          { headers: intruder }
        )
      )
      expect(res.status).toBe(404)
      expect(await getEnrollments(intruder)).toHaveLength(0)
    })

    it("requires authentication for enrollments", async () => {
      const res = await settle(
        api.get("/store/customers/me/enrollments", {
          headers: { "x-publishable-api-key": fixture.publishableKey },
        })
      )
      expect(res.status).toBe(401)
    })
  },
})
