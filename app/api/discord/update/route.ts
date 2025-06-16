import { type NextRequest, NextResponse } from "next/server"

interface UpdateRequestBody {
  amount: number
  donor: string
  campaign: {
    raised: number
    goal: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateRequestBody = await request.json()
    const { amount, donor, campaign } = body

    if (!amount || !donor || !campaign) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: "Discord webhook not configured" }, { status: 500 })
    }

    const progressPercentage = ((campaign.raised / campaign.goal) * 100).toFixed(1)
    const embed = {
      title: "🎉 New Donation Received!",
      description: `**${donor}** just donated **$${amount}**!`,
      color: 0x00ff00,
      fields: [
        {
          name: "💰 Total Raised",
          value: `$${campaign.raised.toLocaleString()}`,
          inline: true,
        },
        {
          name: "🎯 Goal",
          value: `$${campaign.goal.toLocaleString()}`,
          inline: true,
        },
        {
          name: "📊 Progress",
          value: `${progressPercentage}%`,
          inline: true,
        },
      ],
    }

    // Send the embed to Discord webhook
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing Discord update:", error)
    return NextResponse.json({ error: "Failed to process Discord update" }, { status: 500 })
  }
}
