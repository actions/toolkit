# @actions/artifact Releases

### 0.1.0

- Initial release

### 0.2.0

- Fixes to TCP connections not closing
- GZip file compression to speed up downloads
- Improved logging and output
- Extra documentation

### 0.3.0

- Fixes to gzip decompression when downloading artifacts
- Support handling 429 response codes
- Improved download experience when dealing with empty files
- Exponential backoff when retryable status codes are encountered
- Clearer error message if storage quota has been reached
- Improved logging and output during artifact download

### 0.3.1

- Fix to ensure temporary gzip files get correctly deleted during artifact upload
- Remove spaces as a forbidden character during upload

### 0.3.2

- Fix to ensure readstreams get correctly reset in the event of a retry

### 0.3.3

- Increase chunk size during upload from 4MB to 8MB
- Improve user-agent strings during API calls to help internally diagnose issues

### 0.3.5

- Retry in the event of a 413 response

### 0.4.0

- Add option to specify custom retentions on artifacts

### 0.4.1

- Update to latest @actions/core version

### 0.4.2

- Improved retry-ability when a partial artifact download is encountered

### 0.5.0

- Improved retry-ability for all http calls during artifact upload and download if an error is encountered

### 0.5.1

- Bump @actions/http-client to version 1.0.11 to fix proxy related issues during artifact upload and download

