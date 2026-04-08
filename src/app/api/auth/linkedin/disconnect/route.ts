import { NextResponse } from 'next/server'

export async function DELETE() {
  const res = NextResponse.json({ disconnected: true })
  res.cookies.delete('li_account')
  return res
}