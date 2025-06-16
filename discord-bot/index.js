import { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, REST, Routes } from "discord.js"
import dotenv from "dotenv"
import fetch from "node-fetch"

dotenv.config()

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
})

// Commands
const commands = [
  new SlashCommandBuilder().setName("fundraising").setDescription("Check current fundraising progress"),

  new SlashCommandBuilder().setName("donate").setDescription("Get donation information"),

  new SlashCommandBuilder().setName("goal").setDescription("Check how much is left to reach the goal"),

  new SlashCommandBuilder().setName("leaderboard").setDescription("Show top donors"),
].map((command) => command.toJSON())

// Register commands
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN)

async function deployCommands() {
  try {
    console.log("Started refreshing application (/) commands.")

    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands })

    console.log("Successfully reloaded application (/) commands.")
  } catch (error) {
    console.error(error)
  }
}

// Fetch campaign data from your API
async function fetchCampaignData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/campaign/status`)
    if (!response.ok) throw new Error("Failed to fetch campaign data")
    return await response.json()
  } catch (error) {
    console.error("Error fetching campaign data:", error)
    return null
  }
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`)
  await deployCommands()
})

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const { commandName } = interaction

  const campaignData = await fetchCampaignData()
  if (!campaignData) {
    await interaction.reply("❌ Unable to fetch campaign data. Please try again later.")
    return
  }

  if (commandName === "fundraising") {
    const progressPercentage = ((campaignData.raised / campaignData.goal) * 100).toFixed(1)

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🎯 " + campaignData.name)
      .setDescription(campaignData.description)
      .addFields(
        { name: "💰 Raised", value: `$${campaignData.raised.toLocaleString()}`, inline: true },
        { name: "🎯 Goal", value: `$${campaignData.goal.toLocaleString()}`, inline: true },
        { name: "📊 Progress", value: `${progressPercentage}%`, inline: true },
        { name: "👥 Backers", value: campaignData.backers.toString(), inline: true },
        { name: "💸 Remaining", value: `$${(campaignData.goal - campaignData.raised).toLocaleString()}`, inline: true },
        { name: "⏰ Days Left", value: campaignData.days_left.toString(), inline: true },
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
        { name: "💻 Web Dashboard", value: `${process.env.NEXT_PUBLIC_APP_URL}`, inline: false },
        { name: "💳 PayPal", value: "paypal.me/yourcampaign", inline: false },
        { name: "📱 Venmo", value: "@yourcampaign", inline: false },
        { name: "💰 Cash App", value: "$yourcampaign", inline: false },
      )
      .setFooter({ text: "Every donation helps us reach our goal!" })

    await interaction.reply({ embeds: [embed] })
  }

  if (commandName === "goal") {
    const remaining = campaignData.goal - campaignData.raised
    const progressPercentage = ((campaignData.raised / campaignData.goal) * 100).toFixed(1)

    await interaction.reply(
      `🎯 **Goal Status**\n` +
        `We need **$${remaining.toLocaleString()}** more to reach our goal!\n` +
        `Currently at **${progressPercentage}%** with **${campaignData.backers}** backers\n` +
        `Only **${campaignData.days_left} days** left! 🏃‍♂️`,
    )
  }

  if (commandName === "leaderboard") {
    await interaction.reply("🏆 **Top Donors**\nLeaderboard feature coming soon!")
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)
