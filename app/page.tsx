"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Users, Target, TrendingUp, Calendar, Loader2, Settings } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Campaign {
  id: string
  name: string
  goal: number
  raised: number
  backers: number
  days_left: number
  description: string
  created_at: string
}

interface Donation {
  id: string
  amount: number
  donor_name: string
  created_at: string
}

export default function DirektKreditDashboard() {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [newDonation, setNewDonation] = useState("")
  const [donorName, setDonorName] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newGoal, setNewGoal] = useState("")
  const [newDaysLeft, setNewDaysLeft] = useState("")

  useEffect(() => {
    fetchCampaignData()
    fetchRecentDonations()
  }, [])

  const fetchCampaignData = async () => {
    try {
      const { data, error } = await supabase.from("campaigns").select("*").single()

      if (error) throw error
      setCampaign(data)
      setNewGoal(data.goal.toString())
      setNewDaysLeft(data.days_left.toString())
    } catch (error) {
      console.error("Fehler beim Laden der Kampagne:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentDonations = async () => {
    try {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error
      setDonations(data || [])
    } catch (error) {
      console.error("Fehler beim Laden der Direktkredite:", error)
    }
  }

  const handleAddDonation = async () => {
    if (!campaign) return

    const amount = Number.parseFloat(newDonation)
    if (amount <= 0) return

    setSubmitting(true)
    try {
      const { error } = await supabase.from("donations").insert({
        campaign_id: campaign.id,
        amount: amount,
        donor_name: donorName || "Anonym",
      })

      if (error) throw error

      await fetchCampaignData()
      await fetchRecentDonations()
      await sendDiscordUpdate(amount, donorName || "Anonym")

      setNewDonation("")
      setDonorName("")
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Direktkredits:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateCampaign = async () => {
    if (!campaign) return

    const goal = Number.parseFloat(newGoal)
    const daysLeft = Number.parseInt(newDaysLeft)

    if (goal <= 0 || daysLeft < 0) return

    try {
      const { error } = await supabase
        .from("campaigns")
        .update({
          goal: goal,
          days_left: daysLeft,
        })
        .eq("id", campaign.id)

      if (error) throw error

      await fetchCampaignData()
      setShowSettings(false)
    } catch (error) {
      console.error("Fehler beim Aktualisieren der Kampagne:", error)
    }
  }

  const sendDiscordUpdate = async (amount: number, donor: string) => {
    try {
      await fetch("/api/discord/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          donor,
          campaign,
        }),
      })
    } catch (error) {
      console.error("Discord-Update fehlgeschlagen:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Keine Kampagne gefunden</h1>
          <p className="text-gray-600">Bitte erstelle zuerst eine Kampagne.</p>
        </div>
      </div>
    )
  }

  const progressPercentage = (campaign.raised / campaign.goal) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 relative">
          <h1 className="text-4xl font-bold text-gray-900">Direktkredit-Kampagne Ausbau</h1>
          <Badge variant="secondary" className="text-sm">
            <Calendar className="w-4 h-4 mr-1" />
            {campaign.days_left} Tage verbleibend
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="absolute top-0 right-0"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="border-2 border-yellow-200">
            <CardHeader>
              <CardTitle>Kampagnen-Einstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ziel (€)</label>
                  <Input
                    type="number"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Neues Ziel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Verbleibende Tage</label>
                  <Input
                    type="number"
                    value={newDaysLeft}
                    onChange={(e) => setNewDaysLeft(e.target.value)}
                    placeholder="Tage bis Ende"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateCampaign}>Aktualisieren</Button>
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Abbrechen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Progress Card */}
        <Card className="border-2 border-emerald-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Kampagnen-Fortschritt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-emerald-600">€{campaign.raised.toLocaleString()}</div>
              <div className="text-gray-500">von €{campaign.goal.toLocaleString()} Ziel</div>
            </div>

            <Progress value={progressPercentage} className="h-4" />

            <div className="text-center text-sm text-gray-600">{progressPercentage.toFixed(1)}% finanziert</div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">€{campaign.raised.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Gesammelt</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{campaign.backers}</div>
              <div className="text-sm text-gray-500">Unterstützer</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">€{(campaign.goal - campaign.raised).toLocaleString()}</div>
              <div className="text-sm text-gray-500">Noch benötigt</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">
                €{campaign.backers > 0 ? Math.round(campaign.raised / campaign.backers) : 0}
              </div>
              <div className="text-sm text-gray-500">Ø Direktkredit</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Neuen Direktkredit hinzufügen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Name (optional)"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Betrag in Euro"
                value={newDonation}
                onChange={(e) => setNewDonation(e.target.value)}
              />
            </div>

            <Button
              onClick={handleAddDonation}
              className="w-full"
              disabled={submitting || !newDonation || Number.parseFloat(newDonation) <= 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Direktkredit wird hinzugefügt...
                </>
              ) : (
                "Direktkredit hinzufügen"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Direktkredite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {donations.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Noch keine Direktkredite</p>
              ) : (
                donations.map((donation) => (
                  <div key={donation.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">
                        €{donation.amount} von {donation.donor_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(donation.created_at).toLocaleDateString("de-DE")}
                      </div>
                    </div>
                    <Badge variant="outline">Direktkredit</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
