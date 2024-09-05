import { IntegrationDefinition } from '@botpress/sdk'

import { events, states, actions, channels, user, configuration } from './definitions'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'Trello',
  version: '1.0.5',
  readme: 'hub.md',
  description:
    "Boost your chatbot's capabilities with Trello. Easily update cards, add comments, create new cards, and read board members from your chatbot",
  icon: 'icon.svg',
  actions,
  channels,
  user,
  configuration,
  states,
  events,
})
