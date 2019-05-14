'use strict';

const lib = require('..');

describe('@actions/lib', () => {
    it('needs tests');
});

import * as core from '../src/lib'

it('exits successfully', () => {
  jest.spyOn(process, 'exit').mockImplementation()
  core.fail('testing fail');
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

