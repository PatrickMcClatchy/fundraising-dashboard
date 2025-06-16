import nacl from "tweetnacl"

const commands = {
  direktkredit: handleDirektKreditCommand,
  spenden: handleSpendenCommand,
  ziel: handleZielCommand,
}

export default {
  async fetch(request, env) {
    return await handleRequest(request, env)
  },
}

async function handleRequest(request, env) {
  if (request.method === "POST") {
    const body = await request.text()
    const req = JSON.parse(body)

    const headers = request.headers
    const PUBLIC_KEY = env.DISCORD_PUBLIC_KEY
    const signature = headers.get("X-Signature-Ed25519")
    const timestamp = headers.get("X-Signature-Timestamp")

    if (signature && timestamp) {
      const isVerified = nacl.sign.detached.verify(
        new TextEncoder().encode(timestamp + body),
        hexToUint8Array(signature),
        hexToUint8Array(PUBLIC_KEY),
      )

      if (!isVerified) {
        return new Response("Unauthorized", { status: 401 })
      }
    } else {
      return new Response("Missing signature headers", { status: 401 })
    }

    return await handleDiscordInteraction(req, env)
  }

  return new Response("Direktkredit-Kampagne Bot ist online! 🚀", { status: 200 })
}

function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

async function handleDiscordInteraction(interaction, env) {
  const { type, data } = interaction

  if (type === 1) {
    return new Response(JSON.stringify({ type: 1 }), {
      headers: { "Content-Type": "application/json" },
    })
  }

  if (type === 2) {
    const { name } = data

    if (commands[name]) {
      return await commands[name](interaction, env)
    }

    return new Response(
      JSON.stringify({
        type: 4,
        data: { content: "Unbekannter Befehl" },
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  return new Response("Unbekannter Interaktionstyp", { status: 400 })
}

async function fetchCampaignData(env) {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/discord/status`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error("Fehler beim Laden der Kampagnendaten:", error)
    return {
      name: "Direktkredit-Kampagne Ausbau",
      description: "Unterstützt unsere Direktkredit-Kampagne!",
      goal: 50000,
      raised: 32500,
      backers: 127,
      days_left: 15,
    }
  }
}

async function handleDirektKreditCommand(interaction, env) {
  const campaignData = await fetchCampaignData(env)
  const progressPercentage = ((campaignData.raised / campaignData.goal) * 100).toFixed(1)

  const embed = {
    title: `🎯 ${campaignData.name}`,
    description: "Aktueller Stand unserer Direktkredit-Kampagne",
    color: 0x22c55e,
    fields: [
      { name: "💰 Gesammelt", value: `€${campaignData.raised.toLocaleString()}`, inline: true },
      { name: "🎯 Ziel", value: `€${campaignData.goal.toLocaleString()}`, inline: true },
      { name: "📊 Fortschritt", value: `${progressPercentage}%`, inline: true },
      { name: "👥 Unterstützer", value: campaignData.backers.toString(), inline: true },
      {
        name: "💸 Noch benötigt",
        value: `€${(campaignData.goal - campaignData.raised).toLocaleString()}`,
        inline: true,
      },
      { name: "⏰ Tage verbleibend", value: campaignData.days_left.toString(), inline: true },
    ],
    footer: { text: "Auf gehts tuttis ihr schafft das! 💪 • Nutze /spenden für Infos" },
    timestamp: new Date().toISOString(),
  }

  return new Response(
    JSON.stringify({
      type: 4,
      data: { embeds: [embed] },
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  )
}

async function handleSpendenCommand(interaction, env) {
  const embed = {
    title: "💝 Direktkredit geben",
    description: "Unterstützt unsere Direktkredit-Kampagne!",
    color: 0x10b981,
    fields: [
      { name: "💻 Web-Dashboard", value: env.NEXT_PUBLIC_APP_URL, inline: false },
      { name: "🏦 Banküberweisung", value: "IBAN: DE12 3456 7890 1234 5678 90", inline: false },
      { name: "📧 Kontakt", value: "direktkredit@example.de", inline: false },
    ],
    footer: { text: "Auf gehts tuttis ihr schafft das! 💪" },
  }

  return new Response(
    JSON.stringify({
      type: 4,
      data: { embeds: [embed] },
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  )
}

async function handleZielCommand(interaction, env) {
  const campaignData = await fetchCampaignData(env)
  const remaining = campaignData.goal - campaignData.raised
  const progressPercentage = ((campaignData.raised / campaignData.goal) * 100).toFixed(1)

  const content =
    `🎯 **Ziel-Status**\n` +
    `Wir brauchen noch **€${remaining.toLocaleString()}** um unser Ziel zu erreichen!\n` +
    `Aktuell bei **${progressPercentage}%** mit **${campaignData.backers}** Unterstützern\n` +
    `Nur noch **${campaignData.days_left} Tage** Zeit! 🏃‍♂️\n\n` +
    `**Auf gehts tuttis ihr schafft das!** 💪`

  return new Response(
    JSON.stringify({
      type: 4,
      data: { content },
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  )
}
