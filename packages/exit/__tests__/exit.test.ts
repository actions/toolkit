import * as exit from '../src/exit'

it('exits successfully', () => {
  jest.spyOn(process, 'exit').mockImplementation()
  exit.success()
  expect(process.exit).toHaveBeenCalledWith(0)
})

it('exits as a failure', () => {
  jest.spyOn(process, 'exit').mockImplementation()
  exit.failure()
  expect(process.exit).toHaveBeenCalledWith(1)
})

it('exits neutrally', () => {
  jest.spyOn(process, 'exit').mockImplementation()
  exit.neutral()
  expect(process.exit).toHaveBeenCalledWith(78)
})
