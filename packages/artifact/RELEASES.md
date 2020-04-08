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
