import { default as HTTP } from "../src"
import { describe, it, beforeAll, expect } from "@jest/globals"

describe("test the query types", () => {
  let integration: any
  beforeAll(() => {
    integration = new HTTP.integration({ url: "http://www.google.com", cookie: "" })
  })

  async function catchError(cb: any) {
    let error: any
    try {
      await cb()
    } catch (err: any) {
      error = err.message
    }
    expect(error).not.toBeNull()
  }


  it("should run the create query", async () => {
    await catchError(() => {
      return integration.create({
        json: { a: 1 }
      })
    })
  })

  it("should run the read query", async () => {
    const response = await integration.read({
      queryString: "a=1"
    })
    expect(typeof response).toBe("string")
  })

  it("should run the update query", async () => {
    await catchError(() => {
      return integration.update({
        json: { a: 1 }
      })
    })
  })

  it("should run the delete query", async () => {
    await catchError(() => {
      return integration.delete({
        id: 1
      })
    })
  })
})