'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { ArrowLeft, Plus, Send, Edit, Check, X, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface PremiumProcedure {
  id: string
  name: string
  description: string
  created_at: string
}

const DEFAULT_PROCEDURES = [
  { name: 'LIMPEZA DE PELE PROFUNDA', description: 'Procedimento completo de limpeza facial profunda' },
  { name: 'PEELING', description: 'Renovação celular e rejuvenescimento da pele' },
  { name: 'MICROAGULHAMENTO', description: 'Estímulo de colágeno através de microagulhas' },
  { name: 'SKINBOOSTER', description: 'Hidratação profunda com ácido hialurônico' },
  { name: 'HIDRATAÇÃO FACIAL', description: 'Tratamento intensivo de hidratação' },
  { name: 'COLÁGENO', description: 'Reposição de colágeno para firmeza da pele' },
]

export default function PremiumRecommendationsPage() {
  const [procedures, setProcedures] = useState<PremiumProcedure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const router = useRouter()
  const params = useParams()
  const user = getCurrentUser()

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadProcedures()
  }, [user, router])

  const loadProcedures = async () => {
    try {
      const { data, error } = await supabase
        .from('premium_procedures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Se não houver procedimentos, criar os padrões
      if (!data || data.length === 0) {
        await createDefaultProcedures()
      } else {
        setProcedures(data)
      }
    } catch (error: any) {
      toast.error('Erro ao carregar procedimentos')
    } finally {
      setIsLoading(false)
    }
  }

  const createDefaultProcedures = async () => {
    try {
      const defaultData = DEFAULT_PROCEDURES.map(proc => ({
        user_id: user.id,
        name: proc.name,
        description: proc.description
      }))

      const { data, error } = await supabase
        .from('premium_procedures')
        .insert(defaultData)
        .select()

      if (error) throw error
      setProcedures(data || [])
    } catch (error: any) {
      toast.error('Erro ao criar procedimentos padrão')
    }
  }

  const handleAddProcedure = async () => {
    if (!newName.trim()) {
      toast.error('Digite o nome do procedimento')
      return
    }

    try {
      const { data, error } = await supabase
        .from('premium_procedures')
        .insert([{
          user_id: user.id,
          name: newName,
          description: newDescription
        }])
        .select()

      if (error) throw error
      toast.success('Procedimento adicionado!')
      setNewName('')
      setNewDescription('')
      setIsAdding(false)
      loadProcedures()
    } catch (error: any) {
      toast.error('Erro ao adicionar procedimento')
    }
  }

  const handleUpdateProcedure = async (id: string, name: string, description: string) => {
    try {
      const { error } = await supabase
        .from('premium_procedures')
        .update({ name, description })
        .eq('id', id)

      if (error) throw error
      toast.success('Procedimento atualizado!')
      setEditingId(null)
      loadProcedures()
    } catch (error: any) {
      toast.error('Erro ao atualizar procedimento')
    }
  }

  const handleSendToEsthetician = () => {
    const proceduresList = procedures.map(p => `• ${p.name}`).join('\n')
    const message = `🌟 RECOMENDAÇÕES PREMIUM 🌟\n\n${proceduresList}\n\nGostaria de agendar uma avaliação!`
    
    toast.success('Lista copiada! Envie para sua esteticista.')
    navigator.clipboard.writeText(message)
  }

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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/procedures/${params.id}`)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  Recomendações Premium
                </h1>
                <p className="text-sm text-gray-600">Procedimentos avançados para resultados excepcionais</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Card para adicionar novo procedimento */}
        {isAdding ? (
          <Card className="mb-8 border-2 border-dashed border-purple-300 bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-purple-700">
                  <Plus className="w-5 h-5" />
                  Adicionar Novo Procedimento
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false)
                    setNewName('')
                    setNewDescription('')
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_name">Nome do Procedimento</Label>
                <Input
                  id="new_name"
                  placeholder="Ex: BOTOX"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_description">Descrição</Label>
                <Textarea
                  id="new_description"
                  placeholder="Descreva o procedimento..."
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false)
                    setNewName('')
                    setNewDescription('')
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddProcedure}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Check className="w-4 h-4" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-8 flex justify-end">
            <Button
              onClick={() => setIsAdding(true)}
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4" />
              Adicionar Procedimento
            </Button>
          </div>
        )}

        {/* Lista de procedimentos premium */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {procedures.map((procedure) => (
              <Card key={procedure.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                {editingId === procedure.id ? (
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        defaultValue={procedure.name}
                        id={`edit_name_${procedure.id}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        defaultValue={procedure.description}
                        rows={3}
                        id={`edit_desc_${procedure.id}`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(null)}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const name = (document.getElementById(`edit_name_${procedure.id}`) as HTMLInputElement).value
                          const description = (document.getElementById(`edit_desc_${procedure.id}`) as HTMLTextAreaElement).value
                          handleUpdateProcedure(procedure.id, name, description)
                        }}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Salvar
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="text-purple-800">{procedure.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(procedure.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm text-gray-600 mb-4">
                        {procedure.description}
                      </p>
                    </CardContent>
                  </>
                )}
              </Card>
            ))}
          </div>

          {/* Botão de enviar para esteticista */}
          {procedures.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleSendToEsthetician}
                size="lg"
                className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg px-8 py-6"
              >
                <Send className="w-5 h-5" />
                Enviar para Minha Esteticista
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
