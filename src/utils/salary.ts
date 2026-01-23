import { SmartAttendanceReport } from '../types'

export interface SalaryDeductionResult {
  baseSalary: number
  adjustedSalary: number
  deductionAmount: number
  sickDays: number
  workdays: number
}

/**
 * Calculates salary deduction based on sick days.
 * Formula: adjustedSalary = baseSalary × (workdays - sickDays) / workdays
 *
 * Note: Vacation days are NOT deducted (paid leave)
 */
export function calculateSalaryDeduction(
  baseSalary: number,
  report: SmartAttendanceReport
): SalaryDeductionResult {
  const { workdays, sick } = report

  // Handle edge cases: no workdays or future months
  if (workdays === 0) {
    return {
      baseSalary,
      adjustedSalary: baseSalary,
      deductionAmount: 0,
      sickDays: sick,
      workdays
    }
  }

  const workedDaysRatio = (workdays - sick) / workdays
  const adjustedSalary = baseSalary * workedDaysRatio
  const deductionAmount = baseSalary - adjustedSalary

  return {
    baseSalary,
    adjustedSalary,
    deductionAmount,
    sickDays: sick,
    workdays
  }
}
