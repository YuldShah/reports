"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Save, RefreshCw, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"

interface StudentTrackerProps {
    user: User
    template: any
    onSuccess?: () => void
}

// Course labels in Uzbek matching the template questions
const COURSE_FIELDS = [
    { id: "course_1", label: "1-kurs (Freshman)" },
    { id: "course_2", label: "2-kurs (Sophomore)" },
    { id: "course_3", label: "3-kurs (Junior)" },
    { id: "course_4", label: "4-kurs (Senior)" },
    { id: "masters", label: "Magistratura" },
]

export default function StudentTracker({ user, template, onSuccess }: StudentTrackerProps) {
    const [values, setValues] = useState<Record<string, string>>({
        course_1: "",
        course_2: "",
        course_3: "",
        course_4: "",
        masters: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [lastSubmitted, setLastSubmitted] = useState<Date | null>(null)
    const [hasExistingReport, setHasExistingReport] = useState(false)

    // Fetch existing report data if available
    useEffect(() => {
        const fetchExistingData = async () => {
            try {
                const response = await fetch(`/api/reports?userId=${user.telegramId}`)
                if (response.ok) {
                    const data = await response.json()
                    const reports = data.reports || []

                    // Find the latest report for this template
                    const trackerReport = reports.find(
                        (r: any) => r.templateId === template.id
                    )

                    if (trackerReport) {
                        setHasExistingReport(true)
                        setLastSubmitted(new Date(trackerReport.createdAt))
                        // Populate values from the existing report
                        const answers = trackerReport.answers || {}
                        const toStr = (v: any) => {
                            const n = parseInt(v)
                            return (!isNaN(n) && n > 0) ? String(n) : ""
                        }
                        setValues({
                            course_1: toStr(answers.course_1),
                            course_2: toStr(answers.course_2),
                            course_3: toStr(answers.course_3),
                            course_4: toStr(answers.course_4),
                            masters: toStr(answers.masters),
                        })
                    }
                }
            } catch (error) {
                console.error("Error fetching existing tracker data:", error)
            }
        }

        fetchExistingData()
    }, [user.telegramId, template.id])

    const handleValueChange = (fieldId: string, value: string) => {
        // Allow empty string or digits only, strip leading zeros
        if (value === "" || /^\d+$/.test(value)) {
            const stripped = value === "" ? "" : String(parseInt(value, 10))
            setValues(prev => ({ ...prev, [fieldId]: stripped }))
        }
    }

    const handleSubmit = async () => {
        if (!user.teamId) {
            toast({
                title: "Xato",
                description: "Siz jamoaga biriktirilmagan",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.telegramId,
                    teamId: user.teamId,
                    templateId: template.id,
                    title: "Talaba Taqsimoti",
                    answers: numericValues,
                    templateData: numericValues,
                    isStudentTrackerUpdate: true, // Special flag for update logic
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to submit')
            }

            setLastSubmitted(new Date())
            setHasExistingReport(true)

            toast({
                title: "Muvaffaqiyatli!",
                description: "Talaba taqsimoti yangilandi",
            })

            onSuccess?.()
        } catch (error) {
            console.error("Error submitting tracker:", error)
            toast({
                title: "Xato",
                description: "Ma'lumot yuborishda xatolik yuz berdi",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const totalStudents = Object.values(values).reduce((sum, val) => sum + (parseInt(val) || 0), 0)
    const numericValues = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, parseInt(v) || 0])
    )

    return (
        <Card className="glass border-glass-border border-2 border-chart-2/30">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-chart-2/20 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-chart-2" />
                    </div>
                    <div>
                        <CardTitle className="font-heading text-lg">Talaba Taqsimoti</CardTitle>
                        <CardDescription>Sizga taqsimlangan talabalar sonini kiriting</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Course Inputs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {COURSE_FIELDS.map((field) => (
                        <div key={field.id} className="space-y-1.5">
                            <Label htmlFor={field.id} className="text-xs font-medium">
                                {field.label}
                            </Label>
                            <Input
                                id={field.id}
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                value={values[field.id]}
                                onChange={(e) => {
                                  const raw = e.target.value
                                  if (raw === '' || /^\d*$/.test(raw)) {
                                    handleValueChange(field.id, raw)
                                  }
                                }}
                                className="h-10 text-center font-semibold"
                                placeholder="0"
                            />
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg">
                    <span className="text-sm font-medium">Jami talabalar:</span>
                    <span className="font-heading text-xl font-bold text-chart-2">{totalStudents}</span>
                </div>

                {/* Last submitted info */}
                {hasExistingReport && lastSubmitted && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-success" />
                        <span>Oxirgi yangilanish: {lastSubmitted.toLocaleString('uz-UZ')}</span>
                    </div>
                )}

                {/* Submit Button */}
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-chart-2 hover:bg-chart-2/90 text-white"
                >
                    {isSubmitting ? (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Yuklanmoqda...
                        </>
                    ) : hasExistingReport ? (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Yangilash
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Saqlash
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
