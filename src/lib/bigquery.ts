import { BigQuery } from '@google-cloud/bigquery'

const credentials = process.env.GOOGLE_CREDENTIALS_JSON
  ? JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
  : undefined

const bigquery = new BigQuery({
  projectId: process.env.BIGQUERY_PROJECT_ID || 'dw-onfly-prd',
  ...(credentials
    ? { credentials }
    : { keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS }),
})

export async function runQuery<T = Record<string, unknown>>(
  query: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const [rows] = await bigquery.query({ query, params, location: 'us-central1' })
  return rows as T[]
}

export default bigquery
