import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { type, data, period } = await req.json()

  const context =
    type === 'traveler'
      ? `Viajante ${data.travelerName}: ${data.totalTrips} viagens, ${data.totalFlightLegs} trechos de voo, ${data.totalNights} noites de hotel. Destinos: ${(data.topDestinations as { city: string }[])?.map(d => d.city).join(', ')}. Perfil: ${data.personality}.`
      : `Empresa ${data.companyName}: ${data.totalBookings} reservas, R$${Number(data.totalSpent ?? 0).toLocaleString('pt-BR')} investidos. Top destinos: ${(data.topDestinations as { city: string }[])?.map(d => d.city).join(', ')}.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 280,
      messages: [
        {
          role: 'user',
          content: `Escreva uma legenda para LinkedIn sobre a retrospectiva de viagens corporativas de ${period}. Tom: profissional mas entusiasmado. Use emojis com moderação. Máximo 3 parágrafos curtos. Inclua hashtags no final. Responda APENAS a legenda.

Dados: ${context}`,
        },
      ],
    })

    const text = (message.content[0] as { type: string; text: string }).text
    return NextResponse.json({ text })
  } catch (err) {
    console.error('[wrapped/caption]', err)
    return NextResponse.json({ text: null })
  }
}
