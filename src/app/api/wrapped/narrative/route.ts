import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { travelerName, totalTrips, topDestinations, personality, totalNights, totalFlightLegs, period } =
    await req.json()

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Você é um copywriter da Onfly. Escreva 2 frases curtas e impactantes celebrando a jornada deste viajante corporativo em ${period}. Tom: empolgante, caloroso, como Spotify Wrapped. Responda APENAS as frases, sem introdução.

Dados:
- Nome: ${travelerName}
- Viagens: ${totalTrips}
- Trechos de voo: ${totalFlightLegs}
- Noites de hotel: ${totalNights}
- Destinos: ${(topDestinations as { city: string }[])?.map(d => d.city).join(', ') || 'vários destinos'}
- Perfil: ${personality}`,
        },
      ],
    })

    const text = (message.content[0] as { type: string; text: string }).text
    return NextResponse.json({ text })
  } catch (err) {
    console.error('[wrapped/narrative]', err)
    return NextResponse.json({ text: `${travelerName}, que ano incrível de viagens!` })
  }
}
