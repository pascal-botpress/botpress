import { RuntimeError } from '@botpress/client'
import { z } from '@botpress/sdk'
import { events, TrelloEvent } from 'definitions/events'
import { States } from 'definitions/states'
import * as bp from '../.botpress'
import { commentCardEventSchema } from './schemas/webhookEvents/commentCardEventSchema'
import { genericWebhookEventSchema, type genericWebhookEvent } from './schemas/webhookEvents/genericWebhookEventSchema'
import { WebhookCardCommentConsumer } from './webhookCardCommentConsumer'

export class WebhookEventConsumer {
  private ctx: bp.HandlerProps['ctx']
  private client: bp.HandlerProps['client']
  private rawRequest: bp.HandlerProps['req']
  private parsedWebhookEvent!: genericWebhookEvent

  constructor({ req, client, ctx }: bp.HandlerProps) {
    this.ctx = ctx
    this.client = client
    this.rawRequest = req
  }

  async consumeWebhookEvent() {
    this.ensureBodyIsPresent()
    this.parseWebhookEvent()
    await this.ensureWebhookIsAuthenticated()
    await this.handleWebhookEvent()
  }

  private ensureBodyIsPresent() {
    if (!this.rawRequest.body) {
      throw new RuntimeError('No body found in the webhook request')
    }
  }

  private parseWebhookEvent() {
    const body = JSON.parse(this.rawRequest.body!)
    const { success, error, data } = genericWebhookEventSchema.passthrough().safeParse(body)

    if (!success) {
      throw new RuntimeError('Invalid webhook event body', error)
    }

    this.parsedWebhookEvent = data as genericWebhookEvent
  }

  private async ensureWebhookIsAuthenticated() {
    const { state } = await this.client.getState({
      type: 'integration',
      name: States.webhookState,
      id: this.ctx.integrationId,
    })

    if (this.parsedWebhookEvent.webhook.id !== state.payload.trelloWebhookId) {
      throw new RuntimeError('Webhook request is not properly authenticated')
    }
  }

  private async handleWebhookEvent() {
    await Promise.allSettled([this.handleCardComments(), this.publishEventToBotpress()])
  }

  private async handleCardComments() {
    if (this.parsedWebhookEvent.action.type !== TrelloEvent.commentCard) {
      return
    }

    const cardCreationEvent = commentCardEventSchema.parse(this.parsedWebhookEvent)

    const consumer = new WebhookCardCommentConsumer(this.client, cardCreationEvent)
    await consumer.consumeComment()
  }

  private async publishEventToBotpress() {
    if (!Reflect.ownKeys(bp.events).includes(this.parsedWebhookEvent.action.type)) {
      return
    }

    const eventSchema = genericWebhookEventSchema.merge(
      z.object({
        action: genericWebhookEventSchema.shape.action.merge(
          z.object({
            data: events![this.parsedWebhookEvent.action.type]!.schema,
          })
        ),
      })
    )
    const validatedData = eventSchema.passthrough().parse(this.parsedWebhookEvent).action.data

    await this.client.createEvent({ type: this.parsedWebhookEvent.action.type, payload: validatedData })
  }
}
