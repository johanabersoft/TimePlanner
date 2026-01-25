import { useState } from 'react'
import { ConsultantContract, ConsultantContractInput, Currency, CurrencyRate, Employee } from '../types'
import { convertCurrency, formatCurrency } from '../utils/currency'

interface Props {
  contracts: ConsultantContract[]
  employees: Employee[]
  displayCurrency: Currency
  rates: CurrencyRate[]
  onBack: () => void
  onCreate: (contract: ConsultantContractInput) => Promise<ConsultantContract>
  onUpdate: (id: number, contract: Partial<ConsultantContractInput>) => Promise<ConsultantContract | undefined>
  onDelete: (id: number) => Promise<void>
}

export default function ConsultantFeesDetail({
  contracts,
  employees,
  displayCurrency,
  rates,
  onBack,
  onCreate,
  onUpdate,
  onDelete
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingContract, setEditingContract] = useState<ConsultantContract | null>(null)
  const [formData, setFormData] = useState<ConsultantContractInput>({
    company_name: '',
    monthly_fee: 0,
    currency: 'USD',
    start_date: new Date().toISOString().split('T')[0],
    is_active: true,
    employee_ids: []
  })

  const handleEdit = (contract: ConsultantContract) => {
    setEditingContract(contract)
    setFormData({
      company_name: contract.company_name,
      monthly_fee: contract.monthly_fee,
      currency: contract.currency,
      start_date: contract.start_date,
      is_active: contract.is_active,
      employee_ids: contract.employees?.map(e => e.id) || []
    })
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingContract(null)
    setFormData({
      company_name: '',
      monthly_fee: 0,
      currency: 'USD',
      start_date: new Date().toISOString().split('T')[0],
      is_active: true,
      employee_ids: []
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingContract) {
      await onUpdate(editingContract.id, formData)
    } else {
      await onCreate(formData)
    }
    setShowForm(false)
    setEditingContract(null)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this contract?')) {
      await onDelete(id)
    }
  }

  const toggleEmployee = (employeeId: number) => {
    setFormData(prev => ({
      ...prev,
      employee_ids: prev.employee_ids?.includes(employeeId)
        ? prev.employee_ids.filter(id => id !== employeeId)
        : [...(prev.employee_ids || []), employeeId]
    }))
  }

  const activeTotal = contracts
    .filter(c => c.is_active)
    .reduce((sum, c) => sum + convertCurrency(c.monthly_fee, c.currency, displayCurrency, rates), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Consultant Fees</h2>
            <p className="text-sm text-gray-500">
              {contracts.filter(c => c.is_active).length} active contracts - {formatCurrency(activeTotal, displayCurrency)}/month
            </p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Contract
        </button>
      </div>

      {/* Contracts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Fee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No contracts yet. Add your first contract to get started.
                </td>
              </tr>
            ) : (
              contracts.map(contract => (
                <tr key={contract.id} className={!contract.is_active ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{contract.company_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">
                      {formatCurrency(contract.monthly_fee, contract.currency)}
                    </div>
                    {contract.currency !== displayCurrency && (
                      <div className="text-sm text-gray-500">
                        ({formatCurrency(convertCurrency(contract.monthly_fee, contract.currency, displayCurrency, rates), displayCurrency)})
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {contract.employees?.map(emp => (
                        <span
                          key={emp.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {emp.name}
                        </span>
                      ))}
                      {(!contract.employees || contract.employees.length === 0) && (
                        <span className="text-gray-400 text-sm">No employees linked</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(contract.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onUpdate(contract.id, { is_active: !contract.is_active })}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contract.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {contract.is_active ? 'Active' : 'Ended'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(contract)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(contract.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editingContract ? 'Edit Contract' : 'New Contract'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={e => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee</label>
                  <input
                    type="number"
                    value={formData.monthly_fee}
                    onChange={e => setFormData(prev => ({ ...prev, monthly_fee: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value as Currency }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="SEK">SEK (kr)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Linked Employees</label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {employees.length === 0 ? (
                    <p className="text-sm text-gray-500">No employees available</p>
                  ) : (
                    employees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.employee_ids?.includes(emp.id) || false}
                          onChange={() => toggleEmployee(emp.id)}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{emp.name}</span>
                        <span className="text-xs text-gray-400">({emp.position})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Contract is active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingContract(null) }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingContract ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
