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
    // Parse JSON from the request body
    let updates: unknown
    try {
      updates = await request.json()
    } catch {
      return NextResponse.json({ error: "Ungültiges JSON im Request-Body" }, { status: 400 })
    }

    // Validate the update data
    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Ungültige Update-Daten" }, { status: 400 })
    }

    const updateObj = updates as Record<string, unknown>

    // Allow updates to specific fields
    const allowedFields = ["name", "description", "goal", "days_left", "raised"]
    const filteredUpdates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (updateObj[field] !== undefined) {
        filteredUpdates[field] = updateObj[field]
      }
    }

    // Check if at least one field is provided for updating
    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: "Keine gültigen Update-Felder gefunden" }, { status: 400 })
    }

    // Fetch the existing campaign
    const { data: existingCampaign, error: fetchError } = await supabase.from("campaigns").select("id, raised").single()

    if (fetchError) {
      console.error("Fehler beim Abrufen der Kampagnen-ID:", fetchError)
      return NextResponse.json({ error: "Kampagne nicht gefunden" }, { status: 404 })
    }

    // Handle updates to the "raised" field
    if (filteredUpdates.raised !== undefined) {
      const newRaisedAmount = (existingCampaign.raised || 0) + Number(filteredUpdates.raised)
      filteredUpdates.raised = newRaisedAmount
    }

    // Update the campaign
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
