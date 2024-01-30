import * as config from '../src/internal/shared/config'


beforeEach(() => {
    jest.resetModules() 
  });
  

describe('isGhes', () => {
    it('should return false when the request domain is github.com', () => {
        process.env.GITHUB_SERVER_URL = 'https://github.com'
        expect(config.isGhes()).toBe(false)
    })

    it('should return false when the request domain ends with ghe.com', () => {
        process.env.GITHUB_SERVER_URL = 'https://github.ghe.com'
        expect(config.isGhes()).toBe(false)
    })

    it('should return false when the request domain ends with ghe.localhost', () => {
        process.env.GITHUB_SERVER_URL = 'https://github.ghe.localhost'
        expect(config.isGhes()).toBe(false)
    })

    it('should return false when the request domain is specific to an enterprise', () => {
        process.env.GITHUB_SERVER_URL = 'https://my-enterprise.github.com'
        expect(config.isGhes()).toBe(true)
    })
})