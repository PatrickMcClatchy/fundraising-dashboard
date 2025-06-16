import { type NextRequest, NextResponse } from "next/server"

interface UpdateRequestBody {
  action: "add" | "remove"
  amount: number
}

let direktkreditTotal = 0 // This is a temporary in-memory store for the total amount.

export async function POST(request: NextRequest) {
  try {
    const body: UpdateRequestBody = await request.json()
    const { action, amount } = body

    if (!action || !amount || (action !== "add" && action !== "remove")) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (action === "add") {
      direktkreditTotal += amount
    } else if (action === "remove") {
      direktkreditTotal -= amount
    }

    return NextResponse.json({ success: true, total: direktkreditTotal })
  } catch (error) {
    console.error("Error processing Direktkredit update:", error)
    return NextResponse.json({ error: "Failed to process Direktkredit update" }, { status: 500 })
  }
}
