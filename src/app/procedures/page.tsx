'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase, Procedure } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { ArrowLeft, Plus, Edit, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'

const DEFAULT_PROCEDURES = [
  { name: 'Botox', description: 'Aplicação de toxina botulínica para suavização de rugas e linhas de expressão' },
  { name: 'Preenchimentos faciais', description: 'Preenchimento com ácido hialurônico para harmonização facial' },
  { name: 'Preenchimento labial', description: 'Aumento e definição dos lábios com ácido hialurônico' },
  { name: 'Lipo enzimática', description: 'Tratamento não invasivo para redução de gordura localizada' },
  { name: 'Harmonização facial: Mandíbula', description: 'Definição e contorno da mandíbula' },
  { name: 'Harmonização facial: Mento', description: 'Projeção e definição do queixo' },
  { name: 'Microagulhamento', description: 'Tratamento para rejuvenescimento e melhora da textura da pele' }
]

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null)
  const router = useRouter()
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
        .from('procedures')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      
      // Se não houver procedimentos, criar os padrões
      if (!data || data.length === 0) {
        await createDefaultProcedures()
        return
      }
      
      setProcedures(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar procedimentos')
    } finally {
      setIsLoading(false)
    }
  }

  const createDefaultProcedures = async () => {
    try {
      const proceduresToInsert = DEFAULT_PROCEDURES.map(proc => ({
        ...proc,
        user_id: user.id
      }))

      const { error } = await supabase
        .from('procedures')
        .insert(proceduresToInsert)

      if (error) throw error
      
      // Recarregar após criar
      loadProcedures()
    } catch (error: any) {
      console.error('Erro ao criar procedimentos padrão:', error)
      setIsLoading(false)
    }
  }

  const handleSaveProcedure = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    try {
      if (editingProcedure) {
        // Atualizar
        const { error } = await supabase
          .from('procedures')
          .update({ name, description })
          .eq('id', editingProcedure.id)

        if (error) throw error
        toast.success('Procedimento atualizado!')
      } else {
        // Criar
        const { error } = await supabase
          .from('procedures')
          .insert([{ name, description, user_id: user.id }])

        if (error) throw error
        toast.success('Procedimento criado!')
      }

      setIsDialogOpen(false)
      setEditingProcedure(null)
      loadProcedures()
    } catch (error: any) {
      toast.error('Erro ao salvar procedimento')
    }
  }

  const handleDeleteProcedure = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este procedimento?')) return

    try {
      const { error } = await supabase
        .from('procedures')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Procedimento excluído!')
      loadProcedures()
    } catch (error: any) {
      toast.error('Erro ao excluir procedimento')
    }
  }

  const openEditDialog = (procedure: Procedure) => {
    setEditingProcedure(procedure)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingProcedure(null)
    setIsDialogOpen(true)
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Visualização de Procedimentos
                </h1>
                <p className="text-sm text-gray-600">Antes e depois dos procedimentos</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={openCreateDialog}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="w-4 h-4" />
                  Novo Procedimento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingProcedure ? 'Editar Procedimento' : 'Novo Procedimento'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as informações do procedimento
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveProcedure} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Procedimento</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingProcedure?.name}
                      placeholder="Ex: Botox, Preenchimento Labial..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingProcedure?.description || ''}
                      placeholder="Descreva o procedimento..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false)
                        setEditingProcedure(null)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Salvar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {procedures.map((procedure) => (
            <Card
              key={procedure.id}
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-purple-400 relative group"
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  {procedure.name}
                </CardTitle>
                {procedure.description && (
                  <CardDescription className="text-sm line-clamp-2">
                    {procedure.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push(`/procedures/${procedure.id}`)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Ver Exemplos
                </Button>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditDialog(procedure)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProcedure(procedure.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {procedures.length === 0 && (
          <div className="text-center py-12">
            <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhum procedimento cadastrado
            </h3>
            <p className="text-gray-600 mb-4">
              Clique em "Novo Procedimento" para começar
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
