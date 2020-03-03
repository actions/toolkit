import {HttpManager} from './internal-http-manager'

export class DownloadManager extends HttpManager {
  private static _instance: DownloadManager = new DownloadManager()

  constructor() {
    super()
    DownloadManager._instance = this
  }

  static getInstance(): DownloadManager {
    return DownloadManager._instance
  }
}
