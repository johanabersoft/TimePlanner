import { Employee, Currency, CurrencyRate, SmartAttendanceReport } from '../../types'
import { convertCurrency, formatCurrency } from '../../utils/currency'
import { calculateSalaryDeduction } from '../../utils/salary'

interface ReportEmployeeDetailProps {
  employee: Employee
  report: SmartAttendanceReport | null
  displayCurrency: Currency
  rates: CurrencyRate[]
  loading: boolean
  monthLabel: string
}

export default function ReportEmployeeDetail({
  employee,
  report,
  displayCurrency,
  rates,
  loading,
  monthLabel
}: ReportEmployeeDetailProps) {
  const convertedSalary = convertCurrency(employee.salary, employee.currency, displayCurrency, rates)
  const deduction = report
    ? calculateSalaryDeduction(convertedSalary, report)
    : null

  const renderAttendanceBar = () => {
    if (!report || report.workdays === 0) return null

    const workedPct = (report.worked / report.workdays) * 100
    const sickPct = (report.sick / report.workdays) * 100
    const vacationPct = (report.vacation / report.workdays) * 100

    return (
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex">
        <div
          className="bg-green-500 h-full transition-all duration-300"
          style={{ width: `${workedPct}%` }}
          title={`Worked: ${report.worked} days`}
        />
        <div
          className="bg-yellow-500 h-full transition-all duration-300"
          style={{ width: `${sickPct}%` }}
          title={`Sick: ${report.sick} days`}
        />
        <div
          className="bg-blue-500 h-full transition-all duration-300"
          style={{ width: `${vacationPct}%` }}
          title={`Vacation: ${report.vacation} days`}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Employee Info Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-gray-900">{employee.name}</h3>
              <p className="text-gray-500">{employee.position}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Salary</p>
            <p className="text-2xl font-bold text-primary-600 mt-1">
              {formatCurrency(convertedSalary, displayCurrency)}
            </p>
            {deduction && deduction.sickDays > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">Adjusted ({monthLabel}):</p>
                <p className="text-lg font-semibold text-primary-600">
                  {formatCurrency(deduction.adjustedSalary, displayCurrency)}
                </p>
                <p className="text-sm text-red-600">
                  -{formatCurrency(deduction.deductionAmount, displayCurrency)} ({deduction.sickDays} sick day{deduction.sickDays !== 1 ? 's' : ''})
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Report */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <div className="text-center text-gray-500">Loading reports...</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">{monthLabel}</h4>

          {report && report.workdays > 0 ? (
            <>
              {/* Attendance Bar */}
              {renderAttendanceBar()}

              {/* Stats Grid */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{report.worked}</div>
                  <div className="text-sm text-gray-500">Worked</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{report.sick}</div>
                  <div className="text-sm text-gray-500">Sick</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{report.vacation}</div>
                  <div className="text-sm text-gray-500">Vacation</div>
                </div>
              </div>

              {/* Workdays */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total workdays (weekdays)</span>
                  <span className="font-medium">{report.workdays}</span>
                </div>
              </div>

              {/* Salary Adjustment Section */}
              {report.sick > 0 && deduction && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Salary Adjustment</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Base Salary</span>
                      <span className="font-medium">{formatCurrency(deduction.baseSalary, displayCurrency)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Sick Day Deduction ({deduction.sickDays} day{deduction.sickDays !== 1 ? 's' : ''})</span>
                      <span>-{formatCurrency(deduction.deductionAmount, displayCurrency)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                      <span className="font-medium text-gray-700">Adjusted Salary</span>
                      <span className="font-bold text-primary-600">{formatCurrency(deduction.adjustedSalary, displayCurrency)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center py-4">No workdays in this period</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-sm text-gray-600">Worked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span className="text-sm text-gray-600">Sick Leave (deducted)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-sm text-gray-600">Vacation (paid)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
