export class SearchState {
  readonly path: string
  readonly level: number

  constructor(path: string, level: number) {
    this.path = path
    this.level = level
  }
}
