import {Timestamp} from '../../generated'
import * as core from '@actions/core'

export function getExpiration(retentionDays?: number): Timestamp | undefined {
  if (!retentionDays) {
    return undefined
  }

  const maxRetentionDays = getRetentionDays()
  if (maxRetentionDays && maxRetentionDays < retentionDays) {
    core.warning(
      `Retention days cannot be greater than the maximum allowed retention set within the repository. Using ${maxRetentionDays} instead.`
    )
    retentionDays = maxRetentionDays
  }

  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + retentionDays)

  return Timestamp.fromDate(expirationDate)
}

function getRetentionDays(): number | undefined {
  const retentionDays = process.env['GITHUB_RETENTION_DAYS']
  if (!retentionDays) {
    return undefined
  }
  const days = parseInt(retentionDays)
  if (isNaN(days)) {
    return undefined
  }

  return days
}
