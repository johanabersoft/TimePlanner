import { useState, useEffect, useCallback } from 'react'
import { Cost, CostInput } from '../types'

export function useCosts() {
  const [costs, setCosts] = useState<Cost[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [costsData, categoriesData] = await Promise.all([
        window.electronAPI.costs.getAll(),
        window.electronAPI.costs.getCategories()
      ])
      setCosts(costsData)
      setCategories(categoriesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load costs data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const createCost = async (cost: CostInput) => {
    try {
      const newCost = await window.electronAPI.costs.create(cost)
      setCosts(prev => [newCost, ...prev].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        if (a.month !== b.month) return b.month - a.month
        return a.name.localeCompare(b.name)
      }))
      if (!categories.includes(cost.category)) {
        setCategories(prev => [...prev, cost.category].sort())
      }
      return newCost
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cost')
      throw err
    }
  }

  const updateCost = async (id: number, cost: Partial<CostInput>) => {
    try {
      const updated = await window.electronAPI.costs.update(id, cost)
      if (updated) {
        setCosts(prev => prev.map(c => c.id === id ? updated : c).sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year
          if (a.month !== b.month) return b.month - a.month
          return a.name.localeCompare(b.name)
        }))
        if (cost.category && !categories.includes(cost.category)) {
          setCategories(prev => [...prev, cost.category!].sort())
        }
      }
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cost')
      throw err
    }
  }

  const deleteCost = async (id: number) => {
    try {
      await window.electronAPI.costs.delete(id)
      setCosts(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cost')
      throw err
    }
  }

  return {
    costs,
    categories,
    loading,
    error,
    createCost,
    updateCost,
    deleteCost
  }
}
