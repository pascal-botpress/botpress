import { Board, List } from 'definitions/schemas'
import { TrelloBoardRepository } from 'src/repositories/trelloBoardRepository'
import { nameCompare } from '../utils'

export class TrelloListQueryService {
  public constructor(private readonly boardRepository: TrelloBoardRepository) {}

  public async getListsByDisplayName(boardId: Board['id'], name: List['name']): Promise<List[]> {
    const allLists = await this.boardRepository.getListsInBoard(boardId)
    return allLists.filter((l) => nameCompare(l.name, name))
  }
}
