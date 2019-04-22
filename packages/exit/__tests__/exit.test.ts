import * as exit from '../src/exit'

it('exits successfully', async () => {
  jest.spyOn(process, 'exit').mockImplementation()
  await exit.success()
  expect(process.exit).toHaveBeenCalledWith(0)
})

it('exits as a failure', async () => {
  jest.spyOn(process, 'exit').mockImplementation()
  await exit.failure()
  expect(process.exit).toHaveBeenCalledWith(1)
})

it('exits neutrally', async () => {
  jest.spyOn(process, 'exit').mockImplementation()
  await exit.neutral()
  expect(process.exit).toHaveBeenCalledWith(78)
})

it('exits syncrhonously', () => {
  jest.spyOn(process, 'exit').mockImplementation()
  exit.success({sync: true})
  expect(process.exit).toHaveBeenCalledWith(0)
})
