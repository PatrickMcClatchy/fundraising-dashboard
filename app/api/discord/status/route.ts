import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// TypeScript-Interface für Update-Anfragen
interface CampaignUpdate {
  id?: string
  name?: string
  description?: string
  goal?: number
  raised?: number
  backers?: number
  days_left?: number
}

export async function GET() {
  try {
    // Kampagnendaten von Supabase abrufen
    const { data: campaign, error } = await supabase.from("campaigns").select("*").single()

    if (error) throw error

    // Kampagnendaten für Discord-Bot zurückgeben
    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      goal: campaign.goal,
      raised: campaign.raised,
      backers: campaign.backers,
      days_left: campaign.days_left,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
    })
  } catch (error) {
    console.error("Fehler beim Abrufen der Kampagne für Discord:", error)
    return NextResponse.json({ error: "Kampagnendaten konnten nicht abgerufen werden" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // JSON parsen mit Fehlerbehandlung
    let updates: unknown
    try {
      updates = await request.json()
    } catch {
      // parseError entfernt, da nicht verwendet
      return NextResponse.json({ error: "Ungültiges JSON im Request-Body" }, { status: 400 })
    }

    // Validierung der Update-Daten
    if (!isValidCampaignUpdate(updates)) {
      return NextResponse.json({ error: "Ungültige Update-Daten" }, { status: 400 })
    }

    const { id, ...updateFields } = updates

    // Prüfen, ob ID vorhanden ist
    if (!id) {
      // Wenn keine ID angegeben, die erste (und einzige) Kampagne aktualisieren
      const { data: existingCampaign, error: fetchError } = await supabase.from("campaigns").select("id").single()

      if (fetchError) {
        console.error("Fehler beim Abrufen der Kampagnen-ID:", fetchError)
        return NextResponse.json({ error: "Kampagne nicht gefunden" }, { status: 404 })
      }

      // Kampagne mit der gefundenen ID aktualisieren
      const { data, error } = await supabase
        .from("campaigns")
        .update(updateFields)
        .eq("id", existingCampaign.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    // Kampagne mit der angegebenen ID aktualisieren
    const { data, error } = await supabase.from("campaigns").update(updateFields).eq("id", id).select().single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Kampagne mit dieser ID nicht gefunden" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Kampagne von Discord:", error)
    return NextResponse.json({ error: "Kampagne konnte nicht aktualisiert werden" }, { status: 500 })
  }
}

// Type Guard für Campaign-Updates
function isValidCampaignUpdate(updates: unknown): updates is CampaignUpdate {
  if (!updates || typeof updates !== "object") {
    return false
  }

  const obj = updates as Record<string, unknown>

  // Mindestens ein Update-Feld muss vorhanden sein
  const hasValidField =
    (obj.name && typeof obj.name === "string") ||
    (obj.description && typeof obj.description === "string") ||
    (obj.goal && typeof obj.goal === "number" && obj.goal > 0) ||
    (obj.raised && typeof obj.raised === "number" && obj.raised >= 0) ||
    (obj.backers && typeof obj.backers === "number" && obj.backers >= 0) ||
    (obj.days_left && typeof obj.days_left === "number" && obj.days_left >= 0)

  // ID ist optional, aber wenn vorhanden, muss es ein String sein
  const hasValidId = !obj.id || typeof obj.id === "string"

  // Explizite boolean Rückgabe
  return Boolean(hasValidField && hasValidId)
}
