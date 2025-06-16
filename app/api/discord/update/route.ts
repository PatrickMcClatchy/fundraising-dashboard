import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, donor, campaign } = body

    // Add type validation
    if (!amount || !donor || !campaign) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Ensure amount is a number
    const donationAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    if (isNaN(donationAmount) || donationAmount <= 0) {
      return NextResponse.json({ error: "Invalid donation amount" }, { status: 400 })
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL

    if (!webhookUrl) {
      return NextResponse.json({ error: "Discord webhook not configured" }, { status: 500 })
    }

    const progressPercentage = ((campaign.raised / campaign.goal) * 100).toFixed(1)

    // Create rich embed for Discord
    const embed = {
      title: "🎉 New Donation Received!",
      description: `**${donor}** just donated **$${donationAmount}**!`,
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
      footer: {
        text: "Fundraising Dashboard • Thank you for your support!",
      },
      timestamp: new Date().toISOString(),
    }

    // Send to Discord
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to send Discord message")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Discord update error:", error)
    return NextResponse.json({ error: "Failed to update Discord" }, { status: 500 })
  }
}
