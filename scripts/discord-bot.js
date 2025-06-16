// Discord Bot Implementation
// Run this as a separate Node.js application

const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
})

// Mock campaign data (in production, fetch from your database)
let campaignData = {
  name: "Community Gaming Setup",
  goal: 5000,
  raised: 3250,
  backers: 127,
  daysLeft: 15,
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)

  // Register slash commands
  const commands = [
    new SlashCommandBuilder().setName("fundraising").setDescription("Check current fundraising progress"),

    new SlashCommandBuilder().setName("donate").setDescription("Get donation information"),

    new SlashCommandBuilder().setName("goal").setDescription("Check how much is left to reach the goal"),
  ]

  // Register commands with Discord
  client.application.commands.set(commands)
})

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const { commandName } = interaction

  if (commandName === "fundraising") {
    const progressPercentage = ((campaignData.raised / campaignData.goal) * 100).toFixed(1)

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🎯 " + campaignData.name)
      .setDescription("Current fundraising progress")
      .addFields(
        { name: "💰 Raised", value: `$${campaignData.raised.toLocaleString()}`, inline: true },
        { name: "🎯 Goal", value: `$${campaignData.goal.toLocaleString()}`, inline: true },
        { name: "📊 Progress", value: `${progressPercentage}%`, inline: true },
        { name: "👥 Backers", value: campaignData.backers.toString(), inline: true },
        { name: "💸 Remaining", value: `$${(campaignData.goal - campaignData.raised).toLocaleString()}`, inline: true },
        { name: "⏰ Days Left", value: campaignData.daysLeft.toString(), inline: true },
      )
      .setFooter({ text: "Use /donate for donation info" })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }

  if (commandName === "donate") {
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("💝 How to Donate")
      .setDescription("Support our fundraising campaign!")
      .addFields(
        { name: "PayPal", value: "paypal.me/yourcampaign", inline: false },
        { name: "Venmo", value: "@yourcampaign", inline: false },
        { name: "Cash App", value: "$yourcampaign", inline: false },
      )
      .setFooter({ text: "Every donation helps!" })

    await interaction.reply({ embeds: [embed] })
  }

  if (commandName === "goal") {
    const remaining = campaignData.goal - campaignData.raised
    const progressPercentage = ((campaignData.raised / campaignData.goal) * 100).toFixed(1)

    await interaction.reply(
      `🎯 **Goal Status**\n` +
        `We need **$${remaining.toLocaleString()}** more to reach our goal!\n` +
        `Currently at **${progressPercentage}%** (${campaignData.backers} backers)\n` +
        `Only **${campaignData.daysLeft} days** left! 🏃‍♂️`,
    )
  }
})

// Periodic updates (every hour)
setInterval(async () => {
  // Fetch latest data from your API
  try {
    const response = await fetch("http://localhost:3000/api/campaign/status")
    const data = await response.json()
    campaignData = data

    // Optional: Send daily summary to a specific channel
    const channel = client.channels.cache.get("YOUR_CHANNEL_ID")
    if (channel && new Date().getHours() === 9) {
      // 9 AM daily update
      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("📊 Daily Fundraising Summary")
        .setDescription(`Here's where we stand today!`)
        .addFields(
          { name: "Progress", value: `${((campaignData.raised / campaignData.goal) * 100).toFixed(1)}%` },
          { name: "Raised Today", value: "$XXX" }, // You'd track this
          { name: "Days Remaining", value: campaignData.daysLeft.toString() },
        )

      channel.send({ embeds: [embed] })
    }
  } catch (error) {
    console.error("Failed to fetch campaign data:", error)
  }
}, 3600000) // 1 hour

client.login(process.env.DISCORD_BOT_TOKEN)
