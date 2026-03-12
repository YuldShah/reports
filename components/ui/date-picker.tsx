"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  hasError?: boolean
}

export function DatePicker({ value, onChange, placeholder = "kk.oo.yyyy", className, hasError }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [isInvalid, setIsInvalid] = React.useState(false)
  
  // Parse the string value to Date
  const date = value ? new Date(value) : undefined
  
  // Sync input value with date value
  React.useEffect(() => {
    if (value) {
      const parsedDate = new Date(value)
      if (isValid(parsedDate)) {
        setInputValue(format(parsedDate, "dd.MM.yyyy"))
        setIsInvalid(false)
      }
    } else {
      setInputValue("")
      setIsInvalid(false)
    }
  }, [value])
  
  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && onChange) {
      const formatted = format(selectedDate, "yyyy-MM-dd")
      onChange(formatted)
      setInputValue(format(selectedDate, "dd.MM.yyyy"))
      setIsInvalid(false)
    }
    setOpen(false)
  }
  
  const formatDateInput = (input: string): string => {
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, "")
    
    // Format as dd.MM.yyyy
    if (digits.length <= 2) {
      return digits
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}.${digits.slice(2)}`
    } else {
      return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`
    }
  }
  
  const validateAndClampDate = (formatted: string): { valid: boolean; clamped: string } => {
    const parts = formatted.split(".")
    if (parts.length !== 3) return { valid: false, clamped: formatted }
    
    let [day, month, year] = parts.map(p => parseInt(p, 10))
    
    // Clamp month to 1-12
    if (month > 12) month = 12
    if (month < 1 && parts[1].length === 2) month = 1
    
    // Clamp day based on month
    const maxDays = month ? new Date(year || 2024, month, 0).getDate() : 31
    if (day > maxDays) day = maxDays
    if (day < 1 && parts[0].length === 2) day = 1
    
    // Clamp year to reasonable range (1900-2100)
    if (year && parts[2].length === 4) {
      if (year < 1900) year = 1900
      if (year > 2100) year = 2100
    }
    
    const clampedStr = `${day.toString().padStart(2, "0")}.${month.toString().padStart(2, "0")}.${year || parts[2]}`
    
    // Final validation - check if the date is actually valid
    if (clampedStr.length === 10) {
      const parsed = parse(clampedStr, "dd.MM.yyyy", new Date())
      return { valid: isValid(parsed), clamped: clampedStr }
    }
    
    return { valid: true, clamped: clampedStr }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const formatted = formatDateInput(rawValue)
    
    // Validate and clamp as user types
    if (formatted.length >= 5) {
      const { clamped } = validateAndClampDate(formatted)
      setInputValue(clamped)
      
      // Try to parse the date when we have a complete date (10 chars: dd.MM.yyyy)
      if (clamped.length === 10) {
        const parsed = parse(clamped, "dd.MM.yyyy", new Date())
        if (isValid(parsed) && onChange) {
          onChange(format(parsed, "yyyy-MM-dd"))
          setIsInvalid(false)
        } else {
          setIsInvalid(true)
        }
      }
    } else {
      setInputValue(formatted)
    }
  }
  
  const handleBlur = () => {
    // On blur, validate the complete date
    if (inputValue.length === 10) {
      const { valid, clamped } = validateAndClampDate(inputValue)
      setInputValue(clamped)
      if (valid) {
        const parsed = parse(clamped, "dd.MM.yyyy", new Date())
        if (isValid(parsed) && onChange) {
          onChange(format(parsed, "yyyy-MM-dd"))
          setIsInvalid(false)
        }
      } else {
        setIsInvalid(true)
      }
    } else if (inputValue.length > 0 && inputValue.length < 10) {
      // Incomplete date
      setIsInvalid(true)
    }
  }

  return (
    <div className="relative">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={10}
        className={cn(
          "w-full pr-12",
          (hasError || isInvalid) && "border-destructive",
          className
        )}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute right-0 top-0 bottom-0 flex w-12 items-center justify-center rounded-r-[calc(var(--radius)+2px)] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <CalendarIcon className="h-5 w-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}