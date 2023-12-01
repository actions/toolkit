import * as core from '@actions/core'

// noopLogs mocks the console.log and core.* functions to prevent output in the console while testing
export const noopLogs = (): void => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(core, 'debug').mockImplementation(() => {})
  jest.spyOn(core, 'info').mockImplementation(() => {})
  jest.spyOn(core, 'warning').mockImplementation(() => {})
}
