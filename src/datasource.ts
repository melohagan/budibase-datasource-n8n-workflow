import { IntegrationBase } from "@budibase/types"
import fetch from "node-fetch"

interface Query {
  method: string
  body?: string
  headers?: { [key: string]: string }
}

class CustomIntegration implements IntegrationBase {
  private readonly host: string
  private readonly apiKey: string

  constructor(config: { host: string; apiKey: string }) {
    this.host = config.host
    this.apiKey = config.apiKey
  }

  async request(host: string, opts: Query) {
    const apiKey = { "X-N8N-API-KEY": this.apiKey }
    opts.headers = opts.headers ? { ...opts.headers, ...apiKey } : apiKey
    const response = await fetch(host, opts)
    if (response.status <= 300) {
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("json")) {
          return await response.json()
        } else {
          return await response.text()
        }
      } catch (err) {
        return await response.text()
      }
    } else {
      const err = await response.text()
      throw new Error(err)
    }
  }

  async create(query: { json: object }) {
    const opts = {
      method: "POST",
      body: JSON.stringify(query.json),
      headers: {
        "Content-Type": "application/json",
      },
    }
    return this.request(`${this.host}/api/v1/workflows`, opts)
  }

  async read(query: { id: number, active: string, tags: string, limit: number, cursor: string }) {
    const opts = {
      method: "GET",
    }
    if (query.id > -1) {
      return this.request(`${this.host}/api/v1/workflows/${query.id}`, opts)
    }
    let queryParams = ""
    if (query.active) {
      queryParams += `&active=${query.active}`
    }
    if (query.tags) {
      queryParams += `&tags=${query.tags}`
    }
    if (query.limit) {
      queryParams += `&limit=${query.limit}`
    }
    if (query.cursor) {
      queryParams += `&cursor=${query.cursor}`
    }
    return this.request(`${this.host}/api/v1/workflows?${queryParams}`, opts)
  }

  async update(query: { id: string, body: string }) {
    const opts = {
      method: "PUT",
      body: query.body,
      headers: {
        "Content-Type": "application/json",
      },
    }
    return this.request(`${this.host}/api/v1/workflows/${query.id}`, opts)
  }

  async delete(query: { id: string }) {
    const opts = {
      method: "DELETE",
    }
    return this.request(`${this.host}/api/v1/workflows/${query.id}`, opts)
  }

  async activate(query: { id: string, active: string }) {
    const opts = {
      method: "POST",
    }
    if (query.active === "true") {
      return this.request(`${this.host}/api/v1/workflows/${query.id}/activate`, opts)
    }
    if (query.active === "false") {
      return this.request(`${this.host}/api/v1/workflows/${query.id}/deactivate`, opts)
    }
    throw new Error("Active must be 'true' or 'false'")
  }
}

export default CustomIntegration
