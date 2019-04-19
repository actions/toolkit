import {Toolkit} from '../src/toolkit'

describe('Toolkit', () => {
  it('runs a sync function', async () => {
    const cb = jest.fn(() => true)
    const value = await Toolkit.run(cb)
    expect(cb).toHaveBeenCalledWith(expect.any(Toolkit))
    expect(value).toBe(true)
  })

  it('runs an async function', async () => {
    const cb = jest.fn(async () => true)
    const value = await Toolkit.run(cb)
    expect(cb).toHaveBeenCalledWith(expect.any(Toolkit))
    expect(value).toBe(true)
  })

  it('logs and fails when an error occurs', async () => {
    const err = new Error()
    const exitFailure = jest.fn()

    await Toolkit.run(async tk => {
      tk.exit.failure = exitFailure
      throw err
    })

    expect(exitFailure).toHaveBeenCalledWith(err)
  })
})
