'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase, Procedure, ProcedureExample } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { ArrowLeft, Plus, Upload, Trash2, Send, Edit, Check, Sparkles, Lock, Unlock, Calendar, Users, Package, DollarSign, FileText, Bell, ClipboardCheck, Award, TrendingUp, BarChart3, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

// Interface para exemplos de procedimentos premium
interface PremiumProcedureExample {
  id: string
  before_image_url: string
  after_image_url: string
  ml_used: number | null
  notes: string
}

// Interface para procedimentos de clientes premium
interface PremiumClientProcedure {
  id: string
  name: string
  discount: string
  description: string
  before_image_url?: string
  after_image_url?: string
  ml_used?: number | null
  notes?: string
}

// Interfaces para Produtividade/Gestão
interface Appointment {
  id: string
  client_name: string
  procedure: string
  date: string
  time: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

interface Client {
  id: string
  name: string
  phone: string
  email: string
  procedures_count: number
  last_visit: string
  notes: string
}

interface StockItem {
  id: string
  name: string
  quantity: number
  unit: string
  min_quantity: number
  last_updated: string
}

interface FinancialRecord {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  date: string
  category: string
}

export default function ProcedureDetailPage() {
  const [procedure, setProcedure] = useState<Procedure | null>(null)
  const [examples, setExamples] = useState<ProcedureExample[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [beforeImagePreview, setBeforeImagePreview] = useState<string | null>(null)
  const [afterImagePreview, setAfterImagePreview] = useState<string | null>(null)
  const [mlUsed, setMlUsed] = useState('')
  const [notes, setNotes] = useState('')
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false)
  const [selectedPremiumProcedure, setSelectedPremiumProcedure] = useState<string | null>(null)
  const [premiumProcedures, setPremiumProcedures] = useState([] as string[])
  const [premiumExamples, setPremiumExamples] = useState<Record<string, PremiumProcedureExample[]>>({})
  const [newProcedure, setNewProcedure] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  
  // Estados para adicionar exemplo premium
  const [premiumBeforePreview, setPremiumBeforePreview] = useState<string | null>(null)
  const [premiumAfterPreview, setPremiumAfterPreview] = useState<string | null>(null)
  const [premiumMlUsed, setPremiumMlUsed] = useState('')
  const [premiumNotes, setPremiumNotes] = useState('')
  const [isAddingPremiumExample, setIsAddingPremiumExample] = useState(false)
  
  // Estados para CLIENTES PREMIUM (novo botão)
  const [isPremiumClientDialogOpen, setIsPremiumClientDialogOpen] = useState(false)
  const [isPremiumClientUnlocked, setIsPremiumClientUnlocked] = useState(false)
  const [premiumClientProcedures, setPremiumClientProcedures] = useState<PremiumClientProcedure[]>([])
  const [selectedPremiumClientProc, setSelectedPremiumClientProc] = useState<PremiumClientProcedure | null>(null)
  const [newClientProcName, setNewClientProcName] = useState('')
  const [newClientProcDiscount, setNewClientProcDiscount] = useState('')
  const [newClientProcDescription, setNewClientProcDescription] = useState('')
  const [clientProcBeforePreview, setClientProcBeforePreview] = useState<string | null>(null)
  const [clientProcAfterPreview, setClientProcAfterPreview] = useState<string | null>(null)
  const [clientProcMlUsed, setClientProcMlUsed] = useState('')
  const [clientProcNotes, setClientProcNotes] = useState('')
  const [isAddingClientProcedure, setIsAddingClientProcedure] = useState(false)
  
  // Estados para PRODUTIVIDADE/GESTÃO
  const [isProductivityDialogOpen, setIsProductivityDialogOpen] = useState(false)
  const [productivityView, setProductivityView] = useState<'dashboard' | 'agenda' | 'clients' | 'stock' | 'financial'>('dashboard')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([])
  const [badges, setBadges] = useState<string[]>([])
  
  // Estado para edição de imagem
  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  
  // Estados para edição inline
  const [editingMlId, setEditingMlId] = useState<string | null>(null)
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [tempMlValue, setTempMlValue] = useState('')
  const [tempNotesValue, setTempNotesValue] = useState('')
  
  const router = useRouter()
  const params = useParams()
  const user = getCurrentUser()

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadProcedure()
    loadExamples()
    loadPremiumExamples()
    loadPremiumClientData()
    loadProductivityData()
  }, [])

  const loadProcedure = async () => {
    try {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setProcedure(data)
    } catch (error: any) {
      toast.error('Erro ao carregar procedimento')
    }
  }

  const loadExamples = async () => {
    try {
      // CORREÇÃO: Filtrar exemplos apenas do usuário atual
      const { data, error } = await supabase
        .from('procedure_examples')
        .select('*')
        .eq('procedure_id', params.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExamples(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar exemplos')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPremiumExamples = () => {
    try {
      // CORREÇÃO: Carregar exemplos premium apenas do usuário atual
      const storageKey = `premiumExamples_${user.id}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setPremiumExamples(JSON.parse(saved))
      }
      
      // Carregar lista de procedimentos premium do usuário
      const proceduresKey = `premiumProcedures_${user.id}`
      const savedProcedures = localStorage.getItem(proceduresKey)
      if (savedProcedures) {
        setPremiumProcedures(JSON.parse(savedProcedures))
      } else {
        // Lista padrão apenas na primeira vez
        const defaultProcedures = [
          'LIMPEZA DE PELE PROFUNDA',
          'PEELING',
          'MICROAGULHAMENTO',
          'SKINBOOSTER',
          'HIDRATAÇÃO FACIAL',
          'COLÁGENO'
        ]
        setPremiumProcedures(defaultProcedures)
        localStorage.setItem(proceduresKey, JSON.stringify(defaultProcedures))
      }
    } catch (error) {
      console.error('Erro ao carregar exemplos premium:', error)
      setPremiumExamples({})
    }
  }

  const loadPremiumClientData = () => {
    try {
      // CORREÇÃO: Carregar dados de clientes premium apenas do usuário atual
      const unlockedKey = `premiumClientUnlocked_${user.id}`
      const proceduresKey = `premiumClientProcedures_${user.id}`
      
      const savedUnlocked = localStorage.getItem(unlockedKey)
      const savedProcedures = localStorage.getItem(proceduresKey)
      
      if (savedUnlocked) {
        setIsPremiumClientUnlocked(JSON.parse(savedUnlocked))
      }
      
      if (savedProcedures) {
        setPremiumClientProcedures(JSON.parse(savedProcedures))
      }
    } catch (error) {
      console.error('Erro ao carregar dados de clientes premium:', error)
    }
  }

  const loadProductivityData = () => {
    try {
      // CORREÇÃO: Carregar dados de produtividade apenas do usuário atual
      const savedAppointments = localStorage.getItem(`productivity_appointments_${user.id}`)
      const savedClients = localStorage.getItem(`productivity_clients_${user.id}`)
      const savedStock = localStorage.getItem(`productivity_stock_${user.id}`)
      const savedFinancial = localStorage.getItem(`productivity_financial_${user.id}`)
      const savedBadges = localStorage.getItem(`productivity_badges_${user.id}`)
      
      if (savedAppointments) setAppointments(JSON.parse(savedAppointments))
      if (savedClients) setClients(JSON.parse(savedClients))
      if (savedStock) setStockItems(JSON.parse(savedStock))
      if (savedFinancial) setFinancialRecords(JSON.parse(savedFinancial))
      if (savedBadges) setBadges(JSON.parse(savedBadges))
    } catch (error) {
      console.error('Erro ao carregar dados de produtividade:', error)
    }
  }

  const saveProductivityData = (key: string, data: any) => {
    try {
      // CORREÇÃO: Salvar com ID do usuário
      localStorage.setItem(`${key}_${user.id}`, JSON.stringify(data))
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
      toast.error('Erro ao salvar dados')
    }
  }

  const addBadge = (badgeName: string) => {
    if (!badges.includes(badgeName)) {
      const updated = [...badges, badgeName]
      setBadges(updated)
      saveProductivityData('productivity_badges', updated)
      toast.success(`🏆 Conquista desbloqueada: ${badgeName}!`)
    }
  }

  const savePremiumClientData = (procedures: PremiumClientProcedure[]) => {
    try {
      // CORREÇÃO: Salvar com ID do usuário
      localStorage.setItem(`premiumClientProcedures_${user.id}`, JSON.stringify(procedures))
      setPremiumClientProcedures(procedures)
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
      toast.error('Erro ao salvar dados')
    }
  }

  const handleUnlockPremiumClient = () => {
    setIsPremiumClientUnlocked(true)
    // CORREÇÃO: Salvar com ID do usuário
    localStorage.setItem(`premiumClientUnlocked_${user.id}`, JSON.stringify(true))
    toast.success('Área de Clientes Premium desbloqueada!')
  }

  const savePremiumExamples = (examples: Record<string, PremiumProcedureExample[]>) => {
    try {
      // Limitar o tamanho dos dados salvos
      const limitedExamples: Record<string, PremiumProcedureExample[]> = {}
      
      Object.keys(examples).forEach(key => {
        // Manter apenas os últimos 5 exemplos por procedimento
        limitedExamples[key] = examples[key].slice(0, 5)
      })
      
      const dataToSave = JSON.stringify(limitedExamples)
      // CORREÇÃO: Salvar com ID do usuário
      localStorage.setItem(`premiumExamples_${user.id}`, dataToSave)
      setPremiumExamples(limitedExamples)
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        toast.error('Limite de armazenamento atingido. Remova alguns exemplos antigos.')
        // Tentar salvar apenas os 3 mais recentes de cada procedimento
        try {
          const minimalExamples: Record<string, PremiumProcedureExample[]> = {}
          Object.keys(examples).forEach(key => {
            minimalExamples[key] = examples[key].slice(0, 3)
          })
          const minimalData = JSON.stringify(minimalExamples)
          localStorage.setItem(`premiumExamples_${user.id}`, minimalData)
          setPremiumExamples(minimalExamples)
        } catch {
          toast.error('Não foi possível salvar. Por favor, remova alguns exemplos.')
        }
      } else {
        console.error('Erro ao salvar exemplos:', error)
        toast.error('Erro ao salvar exemplos')
      }
    }
  }

  const savePremiumProcedures = (procedures: string[]) => {
    try {
      // CORREÇÃO: Salvar lista de procedimentos com ID do usuário
      localStorage.setItem(`premiumProcedures_${user.id}`, JSON.stringify(procedures))
      setPremiumProcedures(procedures)
    } catch (error) {
      console.error('Erro ao salvar procedimentos:', error)
      toast.error('Erro ao salvar procedimentos')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (type === 'before') {
          setBeforeImagePreview(result)
        } else {
          setAfterImagePreview(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePremiumImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0]
    if (file) {
      // Limitar tamanho da imagem para evitar QuotaExceededError
      if (file.size > 500000) { // 500KB
        toast.error('Imagem muito grande. Use uma imagem menor que 500KB.')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (type === 'before') {
          setPremiumBeforePreview(result)
        } else {
          setPremiumAfterPreview(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClientProcImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 500000) {
        toast.error('Imagem muito grande. Use uma imagem menor que 500KB.')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (type === 'before') {
          setClientProcBeforePreview(result)
        } else {
          setClientProcAfterPreview(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveExample = async () => {
    if (!beforeImagePreview || !afterImagePreview) {
      toast.error('Por favor, selecione ambas as imagens')
      return
    }

    setIsUploading(true)

    try {
      // CORREÇÃO: Salvar com user_id para isolamento
      const { error } = await supabase
        .from('procedure_examples')
        .insert([{
          procedure_id: params.id,
          user_id: user.id,
          before_image_url: beforeImagePreview,
          after_image_url: afterImagePreview,
          ml_used: mlUsed ? parseFloat(mlUsed) : null,
          notes
        }])

      if (error) throw error
      toast.success('Exemplo salvo com sucesso!')
      
      // Limpar formulário
      setBeforeImagePreview(null)
      setAfterImagePreview(null)
      setMlUsed('')
      setNotes('')
      
      loadExamples()
    } catch (error: any) {
      toast.error('Erro ao salvar exemplo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSavePremiumExample = () => {
    if (!selectedPremiumProcedure || !premiumBeforePreview || !premiumAfterPreview) {
      toast.error('Por favor, selecione ambas as imagens')
      return
    }

    const newExample: PremiumProcedureExample = {
      id: Date.now().toString(),
      before_image_url: premiumBeforePreview,
      after_image_url: premiumAfterPreview,
      ml_used: premiumMlUsed ? parseFloat(premiumMlUsed) : null,
      notes: premiumNotes
    }

    const updated = { ...premiumExamples }
    if (!updated[selectedPremiumProcedure]) {
      updated[selectedPremiumProcedure] = []
    }
    updated[selectedPremiumProcedure].push(newExample)
    
    savePremiumExamples(updated)
    
    // Limpar formulário
    setPremiumBeforePreview(null)
    setPremiumAfterPreview(null)
    setPremiumMlUsed('')
    setPremiumNotes('')
    setIsAddingPremiumExample(false)
    
    toast.success('Exemplo premium adicionado!')
  }

  const handleAddClientProcedure = () => {
    if (!newClientProcName || !newClientProcDiscount) {
      toast.error('Preencha nome e desconto do procedimento')
      return
    }

    const newProc: PremiumClientProcedure = {
      id: Date.now().toString(),
      name: newClientProcName.toUpperCase(),
      discount: newClientProcDiscount,
      description: newClientProcDescription,
      before_image_url: clientProcBeforePreview || undefined,
      after_image_url: clientProcAfterPreview || undefined,
      ml_used: clientProcMlUsed ? parseFloat(clientProcMlUsed) : undefined,
      notes: clientProcNotes || undefined
    }

    const updated = [...premiumClientProcedures, newProc]
    savePremiumClientData(updated)
    
    // Limpar formulário
    setNewClientProcName('')
    setNewClientProcDiscount('')
    setNewClientProcDescription('')
    setClientProcBeforePreview(null)
    setClientProcAfterPreview(null)
    setClientProcMlUsed('')
    setClientProcNotes('')
    setIsAddingClientProcedure(false)
    
    toast.success('Procedimento promocional adicionado!')
  }

  const handleDeleteClientProcedure = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Tem certeza que deseja excluir este procedimento?')) return

    const updated = premiumClientProcedures.filter(proc => proc.id !== id)
    savePremiumClientData(updated)
    toast.success('Procedimento excluído!')
  }

  const handleSendClientProcToWhatsApp = (proc: PremiumClientProcedure, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const message = `🎁 OFERTA EXCLUSIVA PARA VOCÊ! 🎁\n\n✨ ${proc.name}\n💰 Desconto: ${proc.discount}\n\n${proc.description ? `📝 ${proc.description}\n\n` : ''}${proc.ml_used ? `💉 Quantidade: ${proc.ml_used} ML\n` : ''}${proc.notes ? `\n📌 ${proc.notes}\n` : ''}\n🌟 Aproveite esta promoção exclusiva!\n\nEnviado com carinho pela sua biomédica! 💜`
    
    navigator.clipboard.writeText(message)
    toast.success('Mensagem copiada! Cole no WhatsApp da sua cliente.')
  }

  const handleDeletePremiumExample = (procedureName: string, exampleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('TEM CERTEZA QUE DESEJA EXCLUIR ESTE ÍCONE?')) return

    const updated = { ...premiumExamples }
    updated[procedureName] = updated[procedureName].filter(ex => ex.id !== exampleId)
    savePremiumExamples(updated)
    toast.success('Exemplo excluído!')
  }

  const handleDeleteExample = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!confirm('TEM CERTEZA QUE DESEJA EXCLUIR ESTE ÍCONE?')) return

    try {
      // CORREÇÃO: Verificar se o exemplo pertence ao usuário antes de deletar
      const { error } = await supabase
        .from('procedure_examples')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Exemplo excluído com sucesso!')
      loadExamples()
    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir exemplo')
    }
  }

  const handleUpdateImage = async (exampleId: string, type: 'before' | 'after') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onloadend = async () => {
        const newImageUrl = reader.result as string
        
        try {
          const updateData = type === 'before' 
            ? { before_image_url: newImageUrl }
            : { after_image_url: newImageUrl }

          const { error } = await supabase
            .from('procedure_examples')
            .update(updateData)
            .eq('id', exampleId)
            .eq('user_id', user.id)

          if (error) throw error
          
          toast.success('Imagem atualizada com sucesso!')
          loadExamples()
        } catch (error: any) {
          console.error('Erro ao atualizar imagem:', error)
          toast.error('Erro ao atualizar imagem')
        }
      }
      
      reader.readAsDataURL(file)
    }
    
    input.click()
  }

  const handleSendToClient = (example: ProcedureExample) => {
    toast.success('Link compartilhável copiado! Envie para sua cliente.')
    const shareUrl = `${window.location.origin}/share/${example.id}`
    navigator.clipboard.writeText(shareUrl)
  }

  const handleSendPremiumExampleToClient = (example: PremiumProcedureExample, procedureName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const message = `🌟 Exemplo de ${procedureName} 🌟\n\n${example.ml_used ? `Quantidade: ${example.ml_used} ML\n` : ''}${example.notes ? `\n${example.notes}\n` : ''}\nEnviado com carinho pela sua biomédica! 💜`
    navigator.clipboard.writeText(message)
    toast.success('Informações copiadas! Cole no WhatsApp da sua esteticista.')
  }

  const handleAddPremiumProcedure = () => {
    if (newProcedure.trim()) {
      const updated = [...premiumProcedures, newProcedure.trim().toUpperCase()]
      savePremiumProcedures(updated)
      setNewProcedure('')
      toast.success('Procedimento adicionado!')
    }
  }

  const handleDeletePremiumProcedure = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const procedureName = premiumProcedures[index]
    
    // Remover também os exemplos associados
    const updated = { ...premiumExamples }
    delete updated[procedureName]
    savePremiumExamples(updated)
    
    const updatedProcedures = premiumProcedures.filter((_, i) => i !== index)
    savePremiumProcedures(updatedProcedures)
    toast.success('Procedimento removido!')
  }

  const handleEditPremiumProcedure = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingIndex(index)
    setEditingValue(premiumProcedures[index])
  }

  const handleSaveEdit = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (editingValue.trim()) {
      const oldName = premiumProcedures[index]
      const newName = editingValue.trim().toUpperCase()
      
      // Atualizar nome do procedimento
      const updated = [...premiumProcedures]
      updated[index] = newName
      savePremiumProcedures(updated)
      
      // Migrar exemplos para o novo nome
      if (premiumExamples[oldName]) {
        const updatedExamples = { ...premiumExamples }
        updatedExamples[newName] = updatedExamples[oldName]
        delete updatedExamples[oldName]
        savePremiumExamples(updatedExamples)
      }
      
      setEditingIndex(null)
      setEditingValue('')
      toast.success('Procedimento atualizado!')
    }
  }

  const handleSendPremiumToEstheticist = () => {
    const message = `🌟 RECOMENDAÇÕES PREMIUM 🌟\n\n${premiumProcedures.map((proc, i) => `${i + 1}. ${proc}`).join('\n')}\n\nEnviado com carinho pela sua biomédica! 💜`
    navigator.clipboard.writeText(message)
    toast.success('Lista copiada! Cole no WhatsApp da sua esteticista.')
  }

  const handlePremiumProcedureClick = (procedureName: string) => {
    setSelectedPremiumProcedure(procedureName)
    setIsAddingPremiumExample(false)
  }

  const handleBackToPremiumList = () => {
    setSelectedPremiumProcedure(null)
    setIsAddingPremiumExample(false)
    setPremiumBeforePreview(null)
    setPremiumAfterPreview(null)
    setPremiumMlUsed('')
    setPremiumNotes('')
  }

  const handleStartEditMl = (exampleId: string, currentValue: number | null) => {
    setEditingMlId(exampleId)
    setTempMlValue(currentValue?.toString() || '')
  }

  const handleSaveMl = async (exampleId: string) => {
    try {
      const { error } = await supabase
        .from('procedure_examples')
        .update({ ml_used: tempMlValue ? parseFloat(tempMlValue) : null })
        .eq('id', exampleId)
        .eq('user_id', user.id)

      if (error) throw error
      
      toast.success('Quantidade atualizada!')
      setEditingMlId(null)
      setTempMlValue('')
      loadExamples()
    } catch (error: any) {
      console.error('Erro ao atualizar quantidade:', error)
      toast.error('Erro ao atualizar quantidade')
    }
  }

  const handleStartEditNotes = (exampleId: string, currentValue: string) => {
    setEditingNotesId(exampleId)
    setTempNotesValue(currentValue || '')
  }

  const handleSaveNotes = async (exampleId: string) => {
    try {
      const { error } = await supabase
        .from('procedure_examples')
        .update({ notes: tempNotesValue })
        .eq('id', exampleId)
        .eq('user_id', user.id)

      if (error) throw error
      
      toast.success('Observações atualizadas!')
      setEditingNotesId(null)
      setTempNotesValue('')
      loadExamples()
    } catch (error: any) {
      console.error('Erro ao atualizar observações:', error)
      toast.error('Erro ao atualizar observações')
    }
  }

  // Renderizar Dashboard de Produtividade
  const renderProductivityDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-lg transition-all cursor-pointer" onClick={() => setProductivityView('agenda')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
              <Calendar className="w-5 h-5" />
              Agenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{appointments.length}</p>
            <p className="text-sm text-gray-600">agendamentos</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-all cursor-pointer" onClick={() => setProductivityView('clients')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
              <Users className="w-5 h-5" />
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-900">{clients.length}</p>
            <p className="text-sm text-gray-600">cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-all cursor-pointer" onClick={() => setProductivityView('stock')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <Package className="w-5 h-5" />
              Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">{stockItems.length}</p>
            <p className="text-sm text-gray-600">itens</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-lg transition-all cursor-pointer" onClick={() => setProductivityView('financial')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
              <DollarSign className="w-5 h-5" />
              Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-900">
              R$ {financialRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">receita total</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges de Conquistas */}
      {badges.length > 0 && (
        <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Award className="w-5 h-5" />
              Suas Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, index) => (
                <div key={index} className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {badge}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas e Lembretes */}
      <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Bell className="w-5 h-5" />
            Alertas Importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stockItems.filter(item => item.quantity <= item.min_quantity).length > 0 && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-800 font-semibold">
                  ⚠️ {stockItems.filter(item => item.quantity <= item.min_quantity).length} item(ns) com estoque baixo
                </p>
              </div>
            )}
            {appointments.filter(apt => apt.status === 'scheduled').length > 0 && (
              <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                <p className="text-sm text-blue-800 font-semibold">
                  📅 {appointments.filter(apt => apt.status === 'scheduled').length} agendamento(s) pendente(s)
                </p>
              </div>
            )}
            {stockItems.length === 0 && appointments.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum alerta no momento 🎉</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/procedures')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {procedure?.name}
              </h1>
              <p className="text-sm text-gray-600">{procedure?.description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Card VISUALIZE O SEU PROCEDIMENTO */}
        <Card className="mb-8 border-2 border-purple-300 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Upload className="w-5 h-5" />
                  VISUALIZE O SEU PROCEDIMENTO
                </CardTitle>
                <CardDescription>
                  Veja os exemplos salvos do procedimento
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* Botão RECOMENDAÇÕES PREMIUM */}
                <Dialog open={isPremiumDialogOpen} onOpenChange={setIsPremiumDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg">
                      <Sparkles className="w-4 h-4" />
                      RECOMENDAÇÕES PREMIUM
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-amber-500" />
                        {selectedPremiumProcedure || 'RECOMENDAÇÕES PREMIUM'}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedPremiumProcedure 
                          ? 'Exemplos de clientes que já realizaram este procedimento'
                          : 'Procedimentos especiais para resultados excepcionais'}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 mt-4">
                      {/* Visualização de procedimento específico */}
                      {selectedPremiumProcedure ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={handleBackToPremiumList}
                            className="gap-2"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para lista
                          </Button>

                          {/* Exemplos do procedimento selecionado */}
                          {!isAddingPremiumExample && (
                            <>
                              {premiumExamples[selectedPremiumProcedure]?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {premiumExamples[selectedPremiumProcedure].map((example) => (
                                    <Card key={example.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-amber-200">
                                      <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center justify-between">
                                          <span>Antes e Depois</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => handleDeletePremiumExample(selectedPremiumProcedure, example.id, e)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </CardTitle>
                                        {example.ml_used && (
                                          <CardDescription>
                                            Quantidade: {example.ml_used} ML
                                          </CardDescription>
                                        )}
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        {/* Comparação Lado a Lado */}
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1">
                                            <p className="text-xs font-semibold text-gray-600 text-center">ANTES</p>
                                            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                              {example.before_image_url && (
                                                <img
                                                  src={example.before_image_url}
                                                  alt="Antes"
                                                  className="w-full h-full object-cover"
                                                />
                                              )}
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs font-semibold text-gray-600 text-center">DEPOIS</p>
                                            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                              {example.after_image_url && (
                                                <img
                                                  src={example.after_image_url}
                                                  alt="Depois"
                                                  className="w-full h-full object-cover"
                                                />
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {example.notes && (
                                          <p className="text-sm text-gray-600">
                                            {example.notes}
                                          </p>
                                        )}

                                        <Button
                                          onClick={(e) => handleSendPremiumExampleToClient(example, selectedPremiumProcedure, e)}
                                          className="w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                        >
                                          <Send className="w-4 h-4" />
                                          Enviar para Minha Esteticista
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    Nenhum exemplo cadastrado
                                  </h3>
                                  <p className="text-gray-600 mb-4">
                                    Adicione exemplos de antes e depois deste procedimento
                                  </p>
                                </div>
                              )}

                              <Button
                                onClick={() => setIsAddingPremiumExample(true)}
                                className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                              >
                                <Plus className="w-4 h-4" />
                                Adicionar Novo Exemplo
                              </Button>
                            </>
                          )}

                          {/* Formulário para adicionar exemplo */}
                          {isAddingPremiumExample && (
                            <Card className="border-2 border-dashed border-purple-300">
                              <CardHeader>
                                <CardTitle className="text-lg text-purple-700">
                                  Adicionar Exemplo de {selectedPremiumProcedure}
                                </CardTitle>
                                <CardDescription className="text-amber-600">
                                  ⚠️ Use imagens menores que 500KB para evitar erros
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Foto - Antes</Label>
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handlePremiumImageChange(e, 'before')}
                                      className="cursor-pointer"
                                    />
                                    {premiumBeforePreview && (
                                      <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-purple-200">
                                        <img
                                          src={premiumBeforePreview}
                                          alt="Preview Antes"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Foto - Depois</Label>
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handlePremiumImageChange(e, 'after')}
                                      className="cursor-pointer"
                                    />
                                    {premiumAfterPreview && (
                                      <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-pink-200">
                                        <img
                                          src={premiumAfterPreview}
                                          alt="Preview Depois"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Quantidade Utilizada (ML)</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="Ex: 2.5"
                                    value={premiumMlUsed}
                                    onChange={(e) => setPremiumMlUsed(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Observações</Label>
                                  <Textarea
                                    placeholder="Detalhes sobre o procedimento..."
                                    rows={3}
                                    value={premiumNotes}
                                    onChange={(e) => setPremiumNotes(e.target.value)}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsAddingPremiumExample(false)
                                      setPremiumBeforePreview(null)
                                      setPremiumAfterPreview(null)
                                      setPremiumMlUsed('')
                                      setPremiumNotes('')
                                    }}
                                    className="flex-1"
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    onClick={handleSavePremiumExample}
                                    disabled={!premiumBeforePreview || !premiumAfterPreview}
                                    className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                  >
                                    <Check className="w-4 h-4" />
                                    Salvar Exemplo
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Grid de Cards para cada procedimento */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {premiumProcedures.map((proc, index) => (
                              <Card 
                                key={index} 
                                className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-lg transition-all duration-300 cursor-pointer"
                                onClick={() => handlePremiumProcedureClick(proc)}
                              >
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg text-amber-900 flex items-center justify-between">
                                    {editingIndex === index ? (
                                      <Input
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 mr-2 bg-white"
                                        autoFocus
                                      />
                                    ) : (
                                      <span className="flex-1">{proc}</span>
                                    )}
                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                      {editingIndex === index ? (
                                        <Button
                                          size="sm"
                                          onClick={(e) => handleSaveEdit(index, e)}
                                          className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                                        >
                                          <Check className="w-4 h-4" />
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => handleEditPremiumProcedure(index, e)}
                                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-8 w-8 p-0"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => handleDeletePremiumProcedure(index, e)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-100 h-8 w-8 p-0"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-gray-600">
                                    {premiumExamples[proc]?.length || 0} exemplo(s) cadastrado(s)
                                  </p>
                                  <p className="text-xs text-amber-700 mt-2">
                                    Clique para ver exemplos e adicionar novos
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>

                          {/* Card para Adicionar Novo Procedimento */}
                          <Card className="border-2 border-dashed border-purple-300 bg-white/50">
                            <CardHeader>
                              <CardTitle className="text-lg text-purple-700 flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Adicionar Novo Procedimento
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Digite o nome do procedimento..."
                                  value={newProcedure}
                                  onChange={(e) => setNewProcedure(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleAddPremiumProcedure()}
                                  className="flex-1"
                                />
                                <Button
                                  onClick={handleAddPremiumProcedure}
                                  className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                  <Plus className="w-4 h-4" />
                                  Adicionar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Botão Enviar para Esteticista */}
                          <Button
                            onClick={handleSendPremiumToEstheticist}
                            className="w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg py-6 text-lg"
                          >
                            <Send className="w-5 h-5" />
                            Enviar para Minha Esteticista
                          </Button>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Botão CLIENTES PREMIUM */}
                <Dialog open={isPremiumClientDialogOpen} onOpenChange={setIsPremiumClientDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg">
                      {isPremiumClientUnlocked ? (
                        <Unlock className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      CLIENTES PREMIUM
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                        {isPremiumClientUnlocked ? (
                          <Unlock className="w-6 h-6 text-purple-600" />
                        ) : (
                          <Lock className="w-6 h-6 text-purple-600" />
                        )}
                        CLIENTES PREMIUM
                      </DialogTitle>
                      <DialogDescription>
                        {isPremiumClientUnlocked 
                          ? 'Procedimentos promocionais exclusivos com descontos especiais'
                          : 'Área exclusiva para clientes que já realizaram procedimentos'}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                      {!isPremiumClientUnlocked ? (
                        // Tela de bloqueio
                        <div className="text-center py-12">
                          <Lock className="w-24 h-24 text-purple-300 mx-auto mb-6" />
                          <h3 className="text-2xl font-bold text-gray-800 mb-4">
                            Área Exclusiva Bloqueada
                          </h3>
                          <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Esta área é exclusiva para clientes que já realizaram procedimentos estéticos. 
                            Desbloqueie para acessar ofertas promocionais exclusivas!
                          </p>
                          <Button
                            onClick={handleUnlockPremiumClient}
                            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg px-8 py-6 text-lg"
                          >
                            <Unlock className="w-5 h-5" />
                            Desbloquear Área Premium
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Visualização de procedimento específico */}
                          {selectedPremiumClientProc ? (
                            <div className="space-y-6">
                              <Button
                                variant="outline"
                                onClick={() => setSelectedPremiumClientProc(null)}
                                className="gap-2"
                              >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar para lista
                              </Button>

                              <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
                                <CardHeader>
                                  <CardTitle className="text-2xl text-purple-700">
                                    {selectedPremiumClientProc.name}
                                  </CardTitle>
                                  <CardDescription className="text-lg font-semibold text-pink-600">
                                    💰 Desconto: {selectedPremiumClientProc.discount}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {selectedPremiumClientProc.description && (
                                    <p className="text-gray-700">
                                      {selectedPremiumClientProc.description}
                                    </p>
                                  )}

                                  {(selectedPremiumClientProc.before_image_url || selectedPremiumClientProc.after_image_url) && (
                                    <div className="grid grid-cols-2 gap-4">
                                      {selectedPremiumClientProc.before_image_url && (
                                        <div className="space-y-2">
                                          <p className="text-sm font-semibold text-gray-600 text-center">ANTES</p>
                                          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                            <img
                                              src={selectedPremiumClientProc.before_image_url}
                                              alt="Antes"
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        </div>
                                      )}
                                      {selectedPremiumClientProc.after_image_url && (
                                        <div className="space-y-2">
                                          <p className="text-sm font-semibold text-gray-600 text-center">DEPOIS</p>
                                          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                            <img
                                              src={selectedPremiumClientProc.after_image_url}
                                              alt="Depois"
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {selectedPremiumClientProc.ml_used && (
                                    <p className="text-sm text-gray-600">
                                      💉 Quantidade: {selectedPremiumClientProc.ml_used} ML
                                    </p>
                                  )}

                                  {selectedPremiumClientProc.notes && (
                                    <p className="text-sm text-gray-600">
                                      📌 {selectedPremiumClientProc.notes}
                                    </p>
                                  )}

                                  <Button
                                    onClick={(e) => handleSendClientProcToWhatsApp(selectedPremiumClientProc, e)}
                                    className="w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg py-6 text-lg"
                                  >
                                    <Send className="w-5 h-5" />
                                    Enviar Oferta via WhatsApp
                                  </Button>
                                </CardContent>
                              </Card>
                            </div>
                          ) : (
                            <>
                              {/* Lista de procedimentos promocionais */}
                              {!isAddingClientProcedure && (
                                <>
                                  {premiumClientProcedures.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {premiumClientProcedures.map((proc) => (
                                        <Card
                                          key={proc.id}
                                          className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300 cursor-pointer"
                                          onClick={() => setSelectedPremiumClientProc(proc)}
                                        >
                                          <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-purple-700 flex items-center justify-between">
                                              <span className="flex-1">{proc.name}</span>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => handleDeleteClientProcedure(proc.id, e)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-100 h-8 w-8 p-0"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </CardTitle>
                                            <CardDescription className="text-pink-600 font-semibold">
                                              💰 {proc.discount}
                                            </CardDescription>
                                          </CardHeader>
                                          <CardContent>
                                            {proc.description && (
                                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                {proc.description}
                                              </p>
                                            )}
                                            <Button
                                              onClick={(e) => handleSendClientProcToWhatsApp(proc, e)}
                                              className="w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                              size="sm"
                                            >
                                              <Send className="w-4 h-4" />
                                              Enviar via WhatsApp
                                            </Button>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-12">
                                      <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                        Nenhuma promoção cadastrada
                                      </h3>
                                      <p className="text-gray-600 mb-4">
                                        Adicione procedimentos promocionais exclusivos para suas clientes premium
                                      </p>
                                    </div>
                                  )}

                                  <Button
                                    onClick={() => setIsAddingClientProcedure(true)}
                                    className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg py-6 text-lg"
                                  >
                                    <Plus className="w-5 h-5" />
                                    Adicionar Procedimento Promocional
                                  </Button>
                                </>
                              )}

                              {/* Formulário para adicionar procedimento promocional */}
                              {isAddingClientProcedure && (
                                <Card className="border-2 border-dashed border-purple-300">
                                  <CardHeader>
                                    <CardTitle className="text-lg text-purple-700">
                                      Adicionar Procedimento Promocional
                                    </CardTitle>
                                    <CardDescription>
                                      Crie ofertas exclusivas com descontos para suas clientes premium
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Nome do Procedimento *</Label>
                                      <Input
                                        placeholder="Ex: BOTOX FACIAL"
                                        value={newClientProcName}
                                        onChange={(e) => setNewClientProcName(e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Desconto *</Label>
                                      <Input
                                        placeholder="Ex: 30% OFF ou R$ 200 de desconto"
                                        value={newClientProcDiscount}
                                        onChange={(e) => setNewClientProcDiscount(e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Descrição</Label>
                                      <Textarea
                                        placeholder="Detalhes sobre a promoção..."
                                        rows={3}
                                        value={newClientProcDescription}
                                        onChange={(e) => setNewClientProcDescription(e.target.value)}
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Foto - Antes (opcional)</Label>
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleClientProcImageChange(e, 'before')}
                                          className="cursor-pointer"
                                        />
                                        {clientProcBeforePreview && (
                                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-purple-200">
                                            <img
                                              src={clientProcBeforePreview}
                                              alt="Preview Antes"
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Foto - Depois (opcional)</Label>
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleClientProcImageChange(e, 'after')}
                                          className="cursor-pointer"
                                        />
                                        {clientProcAfterPreview && (
                                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-pink-200">
                                            <img
                                              src={clientProcAfterPreview}
                                              alt="Preview Depois"
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Quantidade (ML) - opcional</Label>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ex: 2.5"
                                        value={clientProcMlUsed}
                                        onChange={(e) => setClientProcMlUsed(e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Observações - opcional</Label>
                                      <Textarea
                                        placeholder="Informações adicionais..."
                                        rows={2}
                                        value={clientProcNotes}
                                        onChange={(e) => setClientProcNotes(e.target.value)}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setIsAddingClientProcedure(false)
                                          setNewClientProcName('')
                                          setNewClientProcDiscount('')
                                          setNewClientProcDescription('')
                                          setClientProcBeforePreview(null)
                                          setClientProcAfterPreview(null)
                                          setClientProcMlUsed('')
                                          setClientProcNotes('')
                                        }}
                                        className="flex-1"
                                      >
                                        Cancelar
                                      </Button>
                                      <Button
                                        onClick={handleAddClientProcedure}
                                        disabled={!newClientProcName || !newClientProcDiscount}
                                        className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                      >
                                        <Check className="w-4 h-4" />
                                        Salvar Promoção
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>


              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Lista de exemplos salvos */}
            {examples.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhum exemplo cadastrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Adicione exemplos de antes e depois para visualizar aqui
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {examples.map((example) => (
                  <Card key={example.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Antes e Depois</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteExample(example.id, e)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 group">
                        {editingMlId === example.id ? (
                          <div className="flex items-center gap-1 flex-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={tempMlValue}
                              onChange={(e) => setTempMlValue(e.target.value)}
                              className="h-7 text-sm flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveMl(example.id)
                                if (e.key === 'Escape') {
                                  setEditingMlId(null)
                                  setTempMlValue('')
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveMl(example.id)}
                              className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1">
                              {example.ml_used ? `Quantidade: ${example.ml_used} ML` : 'Sem quantidade definida'}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleStartEditMl(example.id, example.ml_used)
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Comparação Lado a Lado */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-600 text-center">ANTES</p>
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                            <Image
                              src={example.before_image_url}
                              alt="Antes"
                              fill
                              className="object-cover"
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleUpdateImage(example.id, 'before')
                              }}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-600 text-center">DEPOIS</p>
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                            <Image
                              src={example.after_image_url}
                              alt="Depois"
                              fill
                              className="object-cover"
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleUpdateImage(example.id, 'after')
                              }}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="group relative">
                        {editingNotesId === example.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={tempNotesValue}
                              onChange={(e) => setTempNotesValue(e.target.value)}
                              className="text-sm min-h-[60px]"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setEditingNotesId(null)
                                  setTempNotesValue('')
                                }
                              }}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingNotesId(null)
                                  setTempNotesValue('')
                                }}
                                className="flex-1"
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveNotes(example.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Salvar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {example.notes || 'Sem observações'}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleStartEditNotes(example.id, example.notes || '')
                              }}
                              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>

                      <Button
                        onClick={() => handleSendToClient(example)}
                        className="w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Send className="w-4 h-4" />
                        Enviar para Minha Esteticista
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card para adicionar novo exemplo */}
        <Card className="mb-8 border-2 border-dashed border-purple-300 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Plus className="w-5 h-5" />
              Adicionar Novo Exemplo
            </CardTitle>
            <CardDescription>
              Adicione fotos antes e depois do procedimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="before_image">Foto - Antes</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="before_image"
                    name="before_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'before')}
                    className="cursor-pointer"
                  />
                  {beforeImagePreview && (
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-purple-200">
                      <Image
                        src={beforeImagePreview}
                        alt="Preview Antes"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Selecione uma foto do celular ou computador
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="after_image">Foto - Depois</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="after_image"
                    name="after_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'after')}
                    className="cursor-pointer"
                  />
                  {afterImagePreview && (
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-pink-200">
                      <Image
                        src={afterImagePreview}
                        alt="Preview Depois"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Selecione uma foto do celular ou computador
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ml_used">Quantidade Utilizada (ML)</Label>
              <Input
                id="ml_used"
                name="ml_used"
                type="number"
                step="0.1"
                placeholder="Ex: 2.5"
                value={mlUsed}
                onChange={(e) => setMlUsed(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Detalhes adicionais sobre o procedimento..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSaveExample}
                disabled={isUploading || !beforeImagePreview || !afterImagePreview}
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Check className="w-4 h-4" />
                {isUploading ? 'Salvando...' : 'OK - Salvar Exemplo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
