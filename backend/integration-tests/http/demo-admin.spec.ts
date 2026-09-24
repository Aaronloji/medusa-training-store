import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { DEMO_ADMIN } from "../../src/lib/demo-admin"
import createDemoAdmin from "../../src/migration-scripts/create-demo-admin"
import { createAdminToken, settle } from "../helpers"

jest.setTimeout(120 * 1000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let demoHeaders: Record<string, string>

    beforeEach(async () => {
      const container = getContainer()
      await createDemoAdmin({ container, args: [] })
      const { data } = await api.post("/auth/user/emailpass", DEMO_ADMIN)
      demoHeaders = { authorization: `Bearer ${data.token}` }
    })

    it("creates the demo admin only once", async () => {
      await createDemoAdmin({ container: getContainer(), args: [] })
      const { data } = await api.get("/admin/users", { headers: demoHeaders })
      expect(data.users.filter((u: { email: string }) => u.email === DEMO_ADMIN.email)).toHaveLength(1)
    })

    it("lets the demo admin read the dashboard", async () => {
      const products = await api.get("/admin/products", { headers: demoHeaders })
      const courses = await api.get("/admin/courses", { headers: demoHeaders })
      expect(products.status).toBe(200)
      expect(courses.status).toBe(200)
    })

    it("blocks every write from the demo admin", async () => {
      const create = await settle(
        api.post("/admin/courses", { handle: "x", title: "X" }, { headers: demoHeaders })
      )
      const profile = await settle(
        api.post("/admin/users/me", { first_name: "Hacked" }, { headers: demoHeaders })
      )
      expect(create.status).toBe(403)
      expect(create.data.message).toContain("read-only demo")
      expect(profile.status).toBe(403)
    })

    it("keeps full access for real admins", async () => {
      const headers = await createAdminToken(getContainer(), api)
      const res = await api.post(
        "/admin/courses",
        { handle: "real-admin", title: "Real admin course" },
        { headers }
      )
      expect(res.status).toBe(201)
    })
  },
})
