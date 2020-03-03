import {HttpManager} from './internal-http-manager'

export class UploadManager extends HttpManager {
  private static _instance: UploadManager = new UploadManager()

  constructor() {
    super()
    UploadManager._instance = this
  }

  static getInstance(): UploadManager {
    return UploadManager._instance
  }
}
