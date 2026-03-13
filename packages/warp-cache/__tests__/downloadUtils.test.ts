import * as core from '@actions/core'
import {DownloadProgress} from '../src/internal/downloadUtils'

test('download progress tracked correctly', () => {
  const progress = new DownloadProgress(1000)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(0)
  expect(progress.segmentIndex).toBe(0)
  expect(progress.segmentOffset).toBe(0)
  expect(progress.segmentSize).toBe(0)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(0)
  expect(progress.isDone()).toBe(false)

  progress.nextSegment(500)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(0)
  expect(progress.segmentIndex).toBe(1)
  expect(progress.segmentOffset).toBe(0)
  expect(progress.segmentSize).toBe(500)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(0)
  expect(progress.isDone()).toBe(false)

  progress.setReceivedBytes(250)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(250)
  expect(progress.segmentIndex).toBe(1)
  expect(progress.segmentOffset).toBe(0)
  expect(progress.segmentSize).toBe(500)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(250)
  expect(progress.isDone()).toBe(false)

  progress.setReceivedBytes(500)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(500)
  expect(progress.segmentIndex).toBe(1)
  expect(progress.segmentOffset).toBe(0)
  expect(progress.segmentSize).toBe(500)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(500)
  expect(progress.isDone()).toBe(false)

  progress.nextSegment(500)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(0)
  expect(progress.segmentIndex).toBe(2)
  expect(progress.segmentOffset).toBe(500)
  expect(progress.segmentSize).toBe(500)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(500)
  expect(progress.isDone()).toBe(false)

  progress.setReceivedBytes(250)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(250)
  expect(progress.segmentIndex).toBe(2)
  expect(progress.segmentOffset).toBe(500)
  expect(progress.segmentSize).toBe(500)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(750)
  expect(progress.isDone()).toBe(false)

  progress.setReceivedBytes(500)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(500)
  expect(progress.segmentIndex).toBe(2)
  expect(progress.segmentOffset).toBe(500)
  expect(progress.segmentSize).toBe(500)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(1000)
  expect(progress.isDone()).toBe(true)
})

test('display timer works correctly', done => {
  const progress = new DownloadProgress(1000)

  const infoMock = jest.spyOn(core, 'info')
  infoMock.mockImplementation(() => {})

  const check = (): void => {
    expect(infoMock).toHaveBeenLastCalledWith(
      expect.stringContaining('Received 500 of 1000')
    )
  }

  // Validate no further updates are displayed after stopping the timer.
  const test2 = (): void => {
    check()
    expect(progress.timeoutHandle).toBeUndefined()
    done()
  }

  // Validate the progress is displayed, stop the timer, and call test2.
  const test1 = (): void => {
    check()

    progress.stopDisplayTimer()
    progress.setReceivedBytes(1000)

    setTimeout(() => test2(), 500)
  }

  // Start the timer, update the received bytes, and call test1.
  const start = (): void => {
    progress.startDisplayTimer(10)
    expect(progress.timeoutHandle).toBeDefined()

    progress.setReceivedBytes(500)

    setTimeout(() => test1(), 500)
  }

  start()
})

test('display does not print completed line twice', () => {
  const progress = new DownloadProgress(1000)

  const infoMock = jest.spyOn(core, 'info')
  infoMock.mockImplementation(() => {})

  progress.display()

  expect(progress.displayedComplete).toBe(false)
  expect(infoMock).toHaveBeenCalledTimes(1)

  progress.nextSegment(1000)
  progress.setReceivedBytes(500)
  progress.display()

  expect(progress.displayedComplete).toBe(false)
  expect(infoMock).toHaveBeenCalledTimes(2)

  progress.setReceivedBytes(1000)
  progress.display()

  expect(progress.displayedComplete).toBe(true)
  expect(infoMock).toHaveBeenCalledTimes(3)

  progress.display()

  expect(progress.displayedComplete).toBe(true)
  expect(infoMock).toHaveBeenCalledTimes(3)
})
