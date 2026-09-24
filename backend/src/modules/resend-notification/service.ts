import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import { TEMPLATES } from "./templates"

type Options = {
  api_key?: string
  from?: string
}

type InjectedDependencies = {
  logger: Logger
}

/**
 * Email notification provider backed by the Resend HTTP API.
 * Without an API key (local dev, demo) emails are logged instead of sent,
 * so the rest of the flow works the same everywhere.
 */
class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "resend"

  protected logger_: Logger
  protected options_: Options

  constructor({ logger }: InjectedDependencies, options: Options) {
    super()
    this.logger_ = logger
    this.options_ = options
  }

  static validateOptions(options: Record<string, unknown>) {
    if (options.api_key && !options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The Resend provider needs a `from` address when an API key is set."
      )
    }
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const render = TEMPLATES[notification.template]
    if (!render) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unknown email template "${notification.template}"`
      )
    }
    const email = render(notification.data ?? {})

    if (!this.options_.api_key) {
      this.logger_.info(
        `[resend] (dry run, no API key) to=${notification.to} subject="${email.subject}"`
      )
      return { id: `dry_run_${Date.now()}` }
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options_.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: notification.from ?? this.options_.from,
        to: [notification.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    })

    if (!res.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Resend rejected the email (${res.status}): ${await res.text()}`
      )
    }
    const { id } = (await res.json()) as { id: string }
    return { id }
  }
}

export default ResendNotificationProviderService
