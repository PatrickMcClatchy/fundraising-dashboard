// Schneller Test deiner aktuellen Credentials
async function quickTest() {
    const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "YOUR_BOT_TOKEN_HERE"
    const DISCORD_APPLICATION_ID_WITH_D = process.env.DISCORD_APPLICATION_ID + "d" || "YOUR_APPLICATION_ID_HEREd"
    const DISCORD_APPLICATION_ID_CLEAN = process.env.DISCORD_APPLICATION_ID || "YOUR_APPLICATION_ID_HERE"
  
    if (DISCORD_TOKEN === "YOUR_BOT_TOKEN_HERE") {
      console.log("❌ Bitte setze DISCORD_TOKEN Umgebungsvariable!")
      console.log("export DISCORD_TOKEN='dein_echter_token'")
      console.log("node discord-worker/src/quick-test.js")
      return
    }
  
    console.log("🔍 Teste deine Credentials...")
    console.log("")
  
    // Test 1: Bot Token
    console.log("🤖 Teste Bot Token...")
    try {
      const response = await fetch("https://discord.com/api/v10/users/@me", {
        headers: {
          Authorization: `Bot ${DISCORD_TOKEN}`,
        },
      })
  
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Bot Token funktioniert! Bot: ${data.username}`)
      } else {
        console.log(`❌ Bot Token Problem: ${response.status}`)
        const error = await response.text()
        console.log(error)
        return
      }
    } catch (error) {
      console.log(`❌ Bot Token Fehler: ${error.message}`)
      return
    }
  
    // Test 2: Application ID mit "d"
    console.log("")
    console.log("🔧 Teste Application ID mit 'd'...")
    try {
      const response = await fetch(`https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID_WITH_D}`, {
        headers: {
          Authorization: `Bot ${DISCORD_TOKEN}`,
        },
      })
  
      if (response.ok) {
        console.log("✅ Application ID mit 'd' funktioniert")
      } else {
        console.log(`❌ Application ID mit 'd' funktioniert NICHT: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Application ID mit 'd' Fehler: ${error.message}`)
    }
  
    // Test 3: Application ID ohne "d"
    console.log("")
    console.log("🔧 Teste Application ID ohne 'd'...")
    try {
      const response = await fetch(`https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID_CLEAN}`, {
        headers: {
          Authorization: `Bot ${DISCORD_TOKEN}`,
        },
      })
  
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Application ID ohne 'd' funktioniert! App: ${data.name}`)
        console.log("")
        console.log("🎯 LÖSUNG: Verwende diese Application ID:")
        console.log(`export DISCORD_APPLICATION_ID="${DISCORD_APPLICATION_ID_CLEAN}"`)
      } else {
        console.log(`❌ Application ID ohne 'd' funktioniert auch nicht: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Application ID ohne 'd' Fehler: ${error.message}`)
    }
  
    // Test 4: Befehle registrieren mit korrekter ID
    console.log("")
    console.log("🚀 Teste Befehlsregistrierung mit korrekter ID...")
  
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
  
    try {
      const response = await fetch(`https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID_CLEAN}/commands`, {
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
        result.forEach((cmd) => console.log(`  - /${cmd.name}`))
      } else {
        const error = await response.text()
        console.log(`❌ Befehlsregistrierung fehlgeschlagen: ${response.status}`)
        console.log(error)
      }
    } catch (error) {
      console.log(`❌ Befehlsregistrierung Fehler: ${error.message}`)
    }
  }
  
  quickTest().catch(console.error)
  