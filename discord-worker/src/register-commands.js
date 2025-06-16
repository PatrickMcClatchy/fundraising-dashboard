const commands = [
    {
      name: "direktkredit",
      description: "Zeigt den aktuellen Stand der Direktkredit-Kampagne",
    },
    {
      name: "spenden",
      description: "Informationen zum Direktkredit geben",
    },
    {
      name: "ziel",
      description: "Zeigt wie viel noch bis zum Ziel fehlt",
    },
  ]
  
  async function registerCommands() {
    const DISCORD_TOKEN = process.env.DISCORD_TOKEN
    const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID
  
    if (!DISCORD_TOKEN || !DISCORD_APPLICATION_ID) {
      console.error("❌ Bitte setze DISCORD_TOKEN und DISCORD_APPLICATION_ID Umgebungsvariablen")
      console.log("Beispiel:")
      console.log("export DISCORD_TOKEN='dein_bot_token'")
      console.log("export DISCORD_APPLICATION_ID='deine_application_id'")
      console.log("node src/register-commands.js")
      process.exit(1)
    }
  
    const url = `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`
  
    try {
      console.log("📝 Registriere Discord-Befehle...")
  
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${DISCORD_TOKEN}`,
        },
        body: JSON.stringify(commands),
      })
  
      if (response.ok) {
        const result = await response.json()
        console.log("✅ Befehle erfolgreich registriert!")
        console.log(`${result.length} Befehle registriert:`)
        result.forEach((cmd) => console.log(`  - /${cmd.name}: ${cmd.description}`))
      } else {
        const error = await response.text()
        console.error("❌ Fehler beim Registrieren der Befehle:", error)
      }
    } catch (error) {
      console.error("❌ Fehler:", error.message)
    }
  }
  
  registerCommands()
  