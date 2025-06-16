import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase.from("campaigns").select("*").single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Keine Kampagne gefunden" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fehler beim Abrufen der Kampagne:", error)
    return NextResponse.json({ error: "Kampagne konnte nicht abgerufen werden" }, { status: 500 })
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
    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Ungültige Update-Daten" }, { status: 400 })
    }

    const updateObj = updates as Record<string, unknown>

    // Nur erlaubte Felder für Updates
    const allowedFields = ["name", "description", "goal", "days_left"]
    const filteredUpdates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (updateObj[field] !== undefined) {
        filteredUpdates[field] = updateObj[field]
      }
    }

    // Prüfen, ob mindestens ein Feld zum Aktualisieren vorhanden ist
    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: "Keine gültigen Update-Felder gefunden" }, { status: 400 })
    }

    // Die erste (und einzige) Kampagne aktualisieren
    const { data: existingCampaign, error: fetchError } = await supabase.from("campaigns").select("id").single()

    if (fetchError) {
      console.error("Fehler beim Abrufen der Kampagnen-ID:", fetchError)
      return NextResponse.json({ error: "Kampagne nicht gefunden" }, { status: 404 })
    }

    // Kampagne aktualisieren
    const { data, error } = await supabase
      .from("campaigns")
      .update(filteredUpdates)
      .eq("id", existingCampaign.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Kampagne:", error)
    return NextResponse.json({ error: "Kampagne konnte nicht aktualisiert werden" }, { status: 500 })
  }
}
