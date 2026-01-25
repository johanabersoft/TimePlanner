import { useState, useEffect, useCallback } from 'react'
import {
  ConsultantContract,
  ConsultantContractInput,
  AdRevenue,
  AdRevenueInput,
  IapRevenue,
  IapRevenueInput
} from '../types'

export function useIncome() {
  const [contracts, setContracts] = useState<ConsultantContract[]>([])
  const [adRevenue, setAdRevenueState] = useState<AdRevenue[]>([])
  const [iapRevenue, setIapRevenueState] = useState<IapRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [contractsData, adData, iapData] = await Promise.all([
        window.electronAPI.income.getContracts(),
        window.electronAPI.income.getAdRevenue(),
        window.electronAPI.income.getIapRevenue()
      ])
      setContracts(contractsData)
      setAdRevenueState(adData)
      setIapRevenueState(iapData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load income data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Consultant Contract operations
  const createContract = async (contract: ConsultantContractInput) => {
    try {
      const newContract = await window.electronAPI.income.createContract(contract)
      setContracts(prev => [...prev, newContract].sort((a, b) => a.company_name.localeCompare(b.company_name)))
      return newContract
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contract')
      throw err
    }
  }

  const updateContract = async (id: number, contract: Partial<ConsultantContractInput>) => {
    try {
      const updated = await window.electronAPI.income.updateContract(id, contract)
      if (updated) {
        setContracts(prev => prev.map(c => c.id === id ? updated : c).sort((a, b) => a.company_name.localeCompare(b.company_name)))
      }
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contract')
      throw err
    }
  }

  const deleteContract = async (id: number) => {
    try {
      await window.electronAPI.income.deleteContract(id)
      setContracts(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contract')
      throw err
    }
  }

  // Ad Revenue operations
  const setAdRevenue = async (revenue: AdRevenueInput) => {
    try {
      const newRevenue = await window.electronAPI.income.setAdRevenue(revenue)
      setAdRevenueState(prev => {
        const filtered = prev.filter(r => !(r.year === revenue.year && r.month === revenue.month))
        return [...filtered, newRevenue].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year
          return b.month - a.month
        })
      })
      return newRevenue
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set ad revenue')
      throw err
    }
  }

  const deleteAdRevenue = async (id: number) => {
    try {
      await window.electronAPI.income.deleteAdRevenue(id)
      setAdRevenueState(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete ad revenue')
      throw err
    }
  }

  // IAP Revenue operations
  const setIapRevenue = async (revenue: IapRevenueInput) => {
    try {
      const newRevenue = await window.electronAPI.income.setIapRevenue(revenue)
      setIapRevenueState(prev => {
        const filtered = prev.filter(r =>
          !(r.platform === revenue.platform && r.year === revenue.year && r.month === revenue.month)
        )
        return [...filtered, newRevenue].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year
          return b.month - a.month
        })
      })
      return newRevenue
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set IAP revenue')
      throw err
    }
  }

  const deleteIapRevenue = async (id: number) => {
    try {
      await window.electronAPI.income.deleteIapRevenue(id)
      setIapRevenueState(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete IAP revenue')
      throw err
    }
  }

  return {
    // Data
    contracts,
    adRevenue,
    iapRevenue,
    loading,
    error,
    // Actions
    reload: loadAll,
    createContract,
    updateContract,
    deleteContract,
    setAdRevenue,
    deleteAdRevenue,
    setIapRevenue,
    deleteIapRevenue
  }
}
