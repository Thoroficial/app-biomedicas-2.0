'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, Calendar, Users, Package, DollarSign, FileText, 
  Bell, CheckCircle2, Clock, TrendingUp, Award, Star,
  Plus, Search, Filter, Download, Upload, AlertCircle,
  Activity, Zap, Target, Trophy, Sparkles
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string
  phone: string
  email: string
  lastVisit: string
  nextAppointment?: string
  procedures: string[]
  totalSpent: number
  notes: string
}

interface Appointment {
  id: string
  clientName: string
  procedure: string
  date: string
  time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes: string
}

interface StockItem {
  id: string
  name: string
  category: string
  quantity: number
  minQuantity: number
  unit: string
  price: number
  expiryDate?: string
}

interface Transaction {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  date: string
  category: string
}

interface Alert {
  id: string
  type: 'return' | 'maintenance' | 'session' | 'stock' | 'appointment'
  clientName?: string
  message: string
  date: string
  priority: 'high' | 'medium' | 'low'
  read: boolean
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
}

export default function ProductivityPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Estados para dados
  const [clients, setClients] = useState<Client[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stock, setStock] = useState<StockItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [badges, setBadges] = useState<Badge[]>([])

  // Estados para modais/formulários
  const [showNewClient, setShowNewClient] = useState(false)
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [showNewStock, setShowNewStock] = useState(false)
  const [showNewTransaction, setShowNewTransaction] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/')
      return
    }
    setUser(currentUser)
    loadUserData(currentUser.id)
  }, [router])

  const loadUserData = (userId: string) => {
    // Carregar dados do localStorage específicos do usuário
    const savedClients = localStorage.getItem(`productivity_clients_${userId}`)
    const savedAppointments = localStorage.getItem(`productivity_appointments_${userId}`)
    const savedStock = localStorage.getItem(`productivity_stock_${userId}`)
    const savedTransactions = localStorage.getItem(`productivity_transactions_${userId}`)
    const savedAlerts = localStorage.getItem(`productivity_alerts_${userId}`)
    const savedBadges = localStorage.getItem(`productivity_badges_${userId}`)

    if (savedClients) setClients(JSON.parse(savedClients))
    if (savedAppointments) setAppointments(JSON.parse(savedAppointments))
    if (savedStock) setStock(JSON.parse(savedStock))
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions))
    if (savedAlerts) setAlerts(JSON.parse(savedAlerts))
    
    if (savedBadges) {
      setBadges(JSON.parse(savedBadges))
    } else {
      // Inicializar badges
      const initialBadges: Badge[] = [
        { id: '1', name: 'Primeira Consulta', description: 'Cadastre seu primeiro cliente', icon: '🎯', unlocked: false, progress: 0 },
        { id: '2', name: 'Organizador', description: 'Complete 10 agendamentos', icon: '📅', unlocked: false, progress: 0 },
        { id: '3', name: 'Estoque Controlado', description: 'Cadastre 5 itens no estoque', icon: '📦', unlocked: false, progress: 0 },
        { id: '4', name: 'Financeiro em Dia', description: 'Registre 20 transações', icon: '💰', unlocked: false, progress: 0 },
        { id: '5', name: 'Mestre da Organização', description: 'Use todas as funcionalidades', icon: '👑', unlocked: false, progress: 0 },
      ]
      setBadges(initialBadges)
    }
  }

  const saveData = (key: string, data: any) => {
    if (user) {
      localStorage.setItem(`productivity_${key}_${user.id}`, JSON.stringify(data))
    }
  }

  // Funções para adicionar novos itens
  const addClient = (clientData: Partial<Client>) => {
    const newClient: Client = {
      id: Date.now().toString(),
      name: clientData.name || '',
      phone: clientData.phone || '',
      email: clientData.email || '',
      lastVisit: new Date().toISOString().split('T')[0],
      procedures: [],
      totalSpent: 0,
      notes: clientData.notes || '',
    }
    const updatedClients = [...clients, newClient]
    setClients(updatedClients)
    saveData('clients', updatedClients)
    checkBadgeProgress('clients', updatedClients.length)
    toast.success('Cliente cadastrado com sucesso!')
    setShowNewClient(false)
  }

  const addAppointment = (appointmentData: Partial<Appointment>) => {
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      clientName: appointmentData.clientName || '',
      procedure: appointmentData.procedure || '',
      date: appointmentData.date || '',
      time: appointmentData.time || '',
      status: 'scheduled',
      notes: appointmentData.notes || '',
    }
    const updatedAppointments = [...appointments, newAppointment]
    setAppointments(updatedAppointments)
    saveData('appointments', updatedAppointments)
    
    // Criar alerta automático
    createAutoAlert('appointment', newAppointment.clientName, newAppointment.date)
    checkBadgeProgress('appointments', updatedAppointments.length)
    toast.success('Agendamento criado com sucesso!')
    setShowNewAppointment(false)
  }

  const addStockItem = (stockData: Partial<StockItem>) => {
    const newItem: StockItem = {
      id: Date.now().toString(),
      name: stockData.name || '',
      category: stockData.category || '',
      quantity: stockData.quantity || 0,
      minQuantity: stockData.minQuantity || 0,
      unit: stockData.unit || 'un',
      price: stockData.price || 0,
      expiryDate: stockData.expiryDate,
    }
    const updatedStock = [...stock, newItem]
    setStock(updatedStock)
    saveData('stock', updatedStock)
    
    // Verificar se precisa criar alerta de estoque baixo
    if (newItem.quantity <= newItem.minQuantity) {
      createAutoAlert('stock', newItem.name, '')
    }
    checkBadgeProgress('stock', updatedStock.length)
    toast.success('Item adicionado ao estoque!')
    setShowNewStock(false)
  }

  const addTransaction = (transactionData: Partial<Transaction>) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: transactionData.type || 'income',
      description: transactionData.description || '',
      amount: transactionData.amount || 0,
      date: transactionData.date || new Date().toISOString().split('T')[0],
      category: transactionData.category || '',
    }
    const updatedTransactions = [...transactions, newTransaction]
    setTransactions(updatedTransactions)
    saveData('transactions', updatedTransactions)
    checkBadgeProgress('transactions', updatedTransactions.length)
    toast.success('Transação registrada!')
    setShowNewTransaction(false)
  }

  const createAutoAlert = (type: Alert['type'], name: string, date: string) => {
    let message = ''
    let priority: Alert['priority'] = 'medium'
    
    switch (type) {
      case 'appointment':
        message = `Agendamento confirmado para ${name} em ${date}`
        priority = 'high'
        break
      case 'stock':
        message = `Estoque baixo: ${name}`
        priority = 'high'
        break
      case 'return':
        message = `${name} precisa retornar para avaliação`
        priority = 'medium'
        break
      case 'maintenance':
        message = `${name} - manutenção agendada`
        priority = 'medium'
        break
      case 'session':
        message = `${name} - segunda sessão disponível`
        priority = 'low'
        break
    }

    const newAlert: Alert = {
      id: Date.now().toString(),
      type,
      clientName: name,
      message,
      date: new Date().toISOString().split('T')[0],
      priority,
      read: false,
    }

    const updatedAlerts = [...alerts, newAlert]
    setAlerts(updatedAlerts)
    saveData('alerts', updatedAlerts)
  }

  const checkBadgeProgress = (category: string, count: number) => {
    const updatedBadges = badges.map(badge => {
      if (badge.id === '1' && category === 'clients' && count >= 1 && !badge.unlocked) {
        toast.success(`🎉 Badge desbloqueado: ${badge.name}!`, { duration: 5000 })
        return { ...badge, unlocked: true, progress: 100 }
      }
      if (badge.id === '2' && category === 'appointments') {
        const progress = Math.min((count / 10) * 100, 100)
        const wasUnlocked = badge.unlocked
        const unlocked = count >= 10
        if (unlocked && !wasUnlocked) {
          toast.success(`🎉 Badge desbloqueado: ${badge.name}!`, { duration: 5000 })
        }
        return { ...badge, unlocked, progress }
      }
      if (badge.id === '3' && category === 'stock') {
        const progress = Math.min((count / 5) * 100, 100)
        const wasUnlocked = badge.unlocked
        const unlocked = count >= 5
        if (unlocked && !wasUnlocked) {
          toast.success(`🎉 Badge desbloqueado: ${badge.name}!`, { duration: 5000 })
        }
        return { ...badge, unlocked, progress }
      }
      if (badge.id === '4' && category === 'transactions') {
        const progress = Math.min((count / 20) * 100, 100)
        const wasUnlocked = badge.unlocked
        const unlocked = count >= 20
        if (unlocked && !wasUnlocked) {
          toast.success(`🎉 Badge desbloqueado: ${badge.name}!`, { duration: 5000 })
        }
        return { ...badge, unlocked, progress }
      }
      return badge
    })
    
    setBadges(updatedBadges)
    saveData('badges', updatedBadges)
  }

  const markAlertAsRead = (alertId: string) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId ? { ...alert, read: true } : alert
    )
    setAlerts(updatedAlerts)
    saveData('alerts', updatedAlerts)
  }

  // Cálculos para dashboard
  const totalRevenue = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const profit = totalRevenue - totalExpenses
  
  const todayAppointments = appointments.filter(
    a => a.date === new Date().toISOString().split('T')[0] && a.status === 'scheduled'
  ).length
  
  const lowStockItems = stock.filter(item => item.quantity <= item.minQuantity).length
  
  const unreadAlerts = alerts.filter(a => !a.read).length

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
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
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Produtividade & Gestão
                  </h1>
                  <p className="text-xs text-gray-600">Sua clínica organizada</p>
                </div>
              </div>
            </div>
            
            {/* Alertas */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="relative gap-2"
                onClick={() => setActiveTab('alerts')}
              >
                <Bell className="w-4 h-4" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {unreadAlerts}
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setActiveTab('badges')}
              >
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span className="text-xs">{badges.filter(b => b.unlocked).length}/{badges.length}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="agenda" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Estoque</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2 relative">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Alertas</span>
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadAlerts}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2 border-green-200 hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{todayAppointments}</div>
                  <p className="text-xs text-gray-600 mt-1">agendamentos</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{clients.length}</div>
                  <p className="text-xs text-gray-600 mt-1">cadastrados</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-600" />
                    Estoque
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stock.length}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {lowStockItems > 0 && (
                      <span className="text-red-600 font-semibold">{lowStockItems} baixo!</span>
                    )}
                    {lowStockItems === 0 && 'itens'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-200 hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Lucro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">
                    R$ {profit.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    receita: R$ {totalRevenue.toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos e Resumos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Próximos Agendamentos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    Próximos Agendamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appointments.filter(a => a.status === 'scheduled').slice(0, 5).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Nenhum agendamento próximo
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {appointments
                        .filter(a => a.status === 'scheduled')
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .slice(0, 5)
                        .map(appointment => (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <div>
                              <p className="font-semibold text-sm">{appointment.clientName}</p>
                              <p className="text-xs text-gray-600">{appointment.procedure}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{appointment.time}</p>
                              <p className="text-xs text-gray-600">
                                {new Date(appointment.date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alertas Recentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-600" />
                    Alertas Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts.slice(0, 5).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Nenhum alerta no momento
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {alerts.slice(0, 5).map(alert => (
                        <div
                          key={alert.id}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            alert.read ? 'bg-gray-50' : 'bg-orange-50 hover:bg-orange-100'
                          }`}
                          onClick={() => markAlertAsRead(alert.id)}
                        >
                          <div className={`p-2 rounded-full ${
                            alert.priority === 'high' ? 'bg-red-100' :
                            alert.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}>
                            <AlertCircle className={`w-4 h-4 ${
                              alert.priority === 'high' ? 'text-red-600' :
                              alert.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.message}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(alert.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          {!alert.read && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Badges em Progresso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Suas Conquistas
                </CardTitle>
                <CardDescription>
                  Continue organizando sua clínica e desbloqueie badges!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.slice(0, 3).map(badge => (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        badge.unlocked
                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`text-3xl ${badge.unlocked ? 'animate-bounce' : 'grayscale opacity-50'}`}>
                          {badge.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{badge.name}</p>
                          <p className="text-xs text-gray-600">{badge.description}</p>
                        </div>
                      </div>
                      <Progress value={badge.progress} className="h-2" />
                      <p className="text-xs text-gray-600 mt-2 text-right">
                        {Math.round(badge.progress)}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agenda Tab */}
          <TabsContent value="agenda" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Agenda de Atendimentos</h2>
                <p className="text-sm text-gray-600">Gerencie seus agendamentos</p>
              </div>
              <Button
                onClick={() => setShowNewAppointment(true)}
                className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Plus className="w-4 h-4" />
                Novo Agendamento
              </Button>
            </div>

            {showNewAppointment && (
              <Card className="border-2 border-green-300">
                <CardHeader>
                  <CardTitle>Novo Agendamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      addAppointment({
                        clientName: formData.get('clientName') as string,
                        procedure: formData.get('procedure') as string,
                        date: formData.get('date') as string,
                        time: formData.get('time') as string,
                        notes: formData.get('notes') as string,
                      })
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientName">Cliente</Label>
                        <Input id="clientName" name="clientName" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="procedure">Procedimento</Label>
                        <Input id="procedure" name="procedure" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Data</Label>
                        <Input id="date" name="date" type="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Horário</Label>
                        <Input id="time" name="time" type="time" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea id="notes" name="notes" rows={3} />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Agendar</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewAppointment(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
              {appointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum agendamento cadastrado</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Clique em "Novo Agendamento" para começar
                    </p>
                  </CardContent>
                </Card>
              ) : (
                appointments
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(appointment => (
                    <Card key={appointment.id} className="hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{appointment.clientName}</h3>
                              <Badge
                                variant={
                                  appointment.status === 'completed' ? 'default' :
                                  appointment.status === 'cancelled' ? 'destructive' : 'secondary'
                                }
                              >
                                {appointment.status === 'scheduled' && 'Agendado'}
                                {appointment.status === 'completed' && 'Concluído'}
                                {appointment.status === 'cancelled' && 'Cancelado'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{appointment.procedure}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(appointment.date).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {appointment.time}
                              </span>
                            </div>
                            {appointment.notes && (
                              <p className="text-sm text-gray-600 mt-2 italic">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                          {appointment.status === 'scheduled' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const updated = appointments.map(a =>
                                    a.id === appointment.id ? { ...a, status: 'completed' as const } : a
                                  )
                                  setAppointments(updated)
                                  saveData('appointments', updated)
                                  toast.success('Agendamento concluído!')
                                }}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Cadastro de Clientes</h2>
                <p className="text-sm text-gray-600">Histórico completo de cada cliente</p>
              </div>
              <Button
                onClick={() => setShowNewClient(true)}
                className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="w-4 h-4" />
                Novo Cliente
              </Button>
            </div>

            {showNewClient && (
              <Card className="border-2 border-blue-300">
                <CardHeader>
                  <CardTitle>Novo Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      addClient({
                        name: formData.get('name') as string,
                        phone: formData.get('phone') as string,
                        email: formData.get('email') as string,
                        notes: formData.get('notes') as string,
                      })
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input id="phone" name="phone" type="tel" required />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações / Anamnese</Label>
                      <Textarea id="notes" name="notes" rows={4} />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Cadastrar</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewClient(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.length === 0 ? (
                <Card className="md:col-span-2">
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum cliente cadastrado</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Clique em "Novo Cliente" para começar
                    </p>
                  </CardContent>
                </Card>
              ) : (
                clients.map(client => (
                  <Card key={client.id} className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        {client.name}
                      </CardTitle>
                      <CardDescription>
                        Última visita: {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Telefone:</span> {client.phone}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Email:</span> {client.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Total gasto:</span> R$ {client.totalSpent.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {client.notes && (
                        <div className="pt-3 border-t">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Observações:</p>
                          <p className="text-sm text-gray-600">{client.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Stock Tab */}
          <TabsContent value="stock" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Controle de Estoque</h2>
                <p className="text-sm text-gray-600">Toxinas, bioestimuladores e materiais</p>
              </div>
              <Button
                onClick={() => setShowNewStock(true)}
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="w-4 h-4" />
                Adicionar Item
              </Button>
            </div>

            {showNewStock && (
              <Card className="border-2 border-purple-300">
                <CardHeader>
                  <CardTitle>Novo Item no Estoque</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      addStockItem({
                        name: formData.get('name') as string,
                        category: formData.get('category') as string,
                        quantity: Number(formData.get('quantity')),
                        minQuantity: Number(formData.get('minQuantity')),
                        unit: formData.get('unit') as string,
                        price: Number(formData.get('price')),
                        expiryDate: formData.get('expiryDate') as string || undefined,
                      })
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Item</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Select name="category" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="toxina">Toxina Botulínica</SelectItem>
                            <SelectItem value="bioestimulador">Bioestimulador</SelectItem>
                            <SelectItem value="preenchimento">Preenchimento</SelectItem>
                            <SelectItem value="seringa">Seringas</SelectItem>
                            <SelectItem value="agulha">Agulhas</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantidade</Label>
                        <Input id="quantity" name="quantity" type="number" min="0" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minQuantity">Quantidade Mínima</Label>
                        <Input id="minQuantity" name="minQuantity" type="number" min="0" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unidade</Label>
                        <Select name="unit" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="un">Unidade</SelectItem>
                            <SelectItem value="ml">Mililitro</SelectItem>
                            <SelectItem value="mg">Miligrama</SelectItem>
                            <SelectItem value="cx">Caixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Preço Unitário (R$)</Label>
                        <Input id="price" name="price" type="number" min="0" step="0.01" required />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="expiryDate">Data de Validade (opcional)</Label>
                        <Input id="expiryDate" name="expiryDate" type="date" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Adicionar</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewStock(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stock.length === 0 ? (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="py-12 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum item no estoque</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Clique em "Adicionar Item" para começar
                    </p>
                  </CardContent>
                </Card>
              ) : (
                stock.map(item => (
                  <Card
                    key={item.id}
                    className={`hover:shadow-lg transition-all ${
                      item.quantity <= item.minQuantity ? 'border-2 border-red-300' : ''
                    }`}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-base">{item.name}</span>
                        {item.quantity <= item.minQuantity && (
                          <Badge variant="destructive" className="animate-pulse">
                            Baixo!
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{item.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Quantidade:</span>
                        <span className={`font-bold ${
                          item.quantity <= item.minQuantity ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Mínimo:</span>
                        <span className="text-sm">{item.minQuantity} {item.unit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Preço:</span>
                        <span className="text-sm font-semibold">
                          R$ {item.price.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {item.expiryDate && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-gray-600">Validade:</span>
                          <span className="text-xs">
                            {new Date(item.expiryDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Controle Financeiro</h2>
                <p className="text-sm text-gray-600">Receitas e despesas da clínica</p>
              </div>
              <Button
                onClick={() => setShowNewTransaction(true)}
                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                <Plus className="w-4 h-4" />
                Nova Transação
              </Button>
            </div>

            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Receitas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {totalRevenue.toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Despesas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    R$ {totalExpenses.toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Lucro Líquido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    R$ {profit.toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            </div>

            {showNewTransaction && (
              <Card className="border-2 border-emerald-300">
                <CardHeader>
                  <CardTitle>Nova Transação</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      addTransaction({
                        type: formData.get('type') as 'income' | 'expense',
                        description: formData.get('description') as string,
                        amount: Number(formData.get('amount')),
                        date: formData.get('date') as string,
                        category: formData.get('category') as string,
                      })
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select name="type" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Receita</SelectItem>
                            <SelectItem value="expense">Despesa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Valor (R$)</Label>
                        <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Input id="category" name="category" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Data</Label>
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          defaultValue={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea id="description" name="description" rows={2} required />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Registrar</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewTransaction(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="py-12 text-center">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma transação registrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(transaction => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              <DollarSign className={`w-4 h-4 ${
                                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{transaction.description}</p>
                              <p className="text-xs text-gray-600">
                                {transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR')}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Alertas e Lembretes</h2>
              <p className="text-sm text-gray-600">Notificações automáticas para você</p>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum alerta no momento</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Os alertas aparecerão aqui automaticamente
                    </p>
                  </CardContent>
                </Card>
              ) : (
                alerts.map(alert => (
                  <Card
                    key={alert.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      alert.read ? 'opacity-60' : 'border-2 border-orange-300'
                    }`}
                    onClick={() => markAlertAsRead(alert.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${
                          alert.priority === 'high' ? 'bg-red-100 animate-pulse' :
                          alert.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          <AlertCircle className={`w-6 h-6 ${
                            alert.priority === 'high' ? 'text-red-600' :
                            alert.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              alert.type === 'appointment' ? 'default' :
                              alert.type === 'stock' ? 'destructive' : 'secondary'
                            }>
                              {alert.type === 'appointment' && 'Agendamento'}
                              {alert.type === 'stock' && 'Estoque'}
                              {alert.type === 'return' && 'Retorno'}
                              {alert.type === 'maintenance' && 'Manutenção'}
                              {alert.type === 'session' && 'Segunda Sessão'}
                            </Badge>
                            {!alert.read && (
                              <span className="text-xs font-semibold text-orange-600 animate-pulse">
                                NOVO
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-lg mb-1">{alert.message}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(alert.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Suas Conquistas</h2>
              <p className="text-sm text-gray-600">
                Desbloqueie badges organizando sua clínica!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map(badge => (
                <Card
                  key={badge.id}
                  className={`transition-all ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 shadow-lg'
                      : 'bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className={`text-6xl mb-3 ${
                        badge.unlocked ? 'animate-bounce' : 'grayscale opacity-30'
                      }`}>
                        {badge.icon}
                      </div>
                      {badge.unlocked && (
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-yellow-600 animate-pulse" />
                          <span className="text-sm font-bold text-yellow-600">DESBLOQUEADO!</span>
                          <Sparkles className="w-5 h-5 text-yellow-600 animate-pulse" />
                        </div>
                      )}
                      <h3 className="text-xl font-bold mb-2">{badge.name}</h3>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                    </div>
                    <div className="space-y-2">
                      <Progress value={badge.progress} className="h-3" />
                      <p className="text-xs text-gray-600 text-center">
                        Progresso: {Math.round(badge.progress)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
