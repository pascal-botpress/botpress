import { z } from '@botpress/sdk'
import ListSchema from '../entities/List'

export const getListIdOutputSchema = z
  .object({
    lists: z.array(ListSchema),
  })
  .describe('Output schema for getting a list ID from its name')
