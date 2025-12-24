'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { signIn, signUp, getCurrentUser, setCurrentUser } from '@/lib/auth'
import { Eye, Sparkles, BarChart3, TrendingUp, LogOut } from 'lucide-react'
import { toast } from 'sonner'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()



  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    try {
      const { user } = await signUp(email, password, name)
      setCurrentUser(user)
      setUser(user)
      toast.success('Cadastro realizado com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const { user } = await signIn(email, password)
      setCurrentUser(user)
      setUser(user)
      toast.success('Login realizado com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentUser(null)
    toast.success('Logout realizado com sucesso!')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Eye className="w-8 h-8 text-purple-600" />
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                VISUALIZA.AI
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              Sua clínica mais segura, moderna e lucrativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Cadastro</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome</Label>
                    <Input
                      id="signup-name"
                      name="name"
                      type="text"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  VISUALIZA.AI
                </h1>
                <p className="text-sm text-gray-600">Olá, {user.name}!</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Sua clínica mais segura, moderna e lucrativa
          </h2>
          <p className="text-gray-600">
            Escolha uma das funcionalidades abaixo para começar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 - Visualização de Procedimentos */}
          <Card
            className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 hover:border-purple-400"
            onClick={() => router.push('/procedures')}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                  <Eye className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">VISUALIZE O SEU PROCEDIMENTO</CardTitle>
              </div>
              <CardDescription className="text-base">
                👉 Veja o resultado antes de fazer!<br />
                <span className="font-semibold text-purple-600">Antes e depois</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Mostre aos seus clientes como ficará o resultado dos procedimentos estéticos
              </p>
            </CardContent>
          </Card>

          {/* Card 2 - Chat IA */}
          <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 hover:border-blue-400 opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Chat IA</CardTitle>
              </div>
              <CardDescription className="text-base">
                👉 Chega de responder as mesmas dúvidas todo dia!<br />
                <span className="font-semibold text-blue-600">Assistente 24h</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                O assistente inteligente atende suas clientes 24h por você
              </p>
              <p className="text-xs text-gray-500 mt-2 italic">Em breve...</p>
            </CardContent>
          </Card>

          {/* Card 3 - Produtividade/Gestão */}
          <Card
            className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 hover:border-green-400"
            onClick={() => router.push('/productivity')}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Produtividade / Gestão</CardTitle>
              </div>
              <CardDescription className="text-base">
                👉 Sua clínica organizada e lucrativa sem esforço<br />
                <span className="font-semibold text-green-600">Tudo em um só lugar</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Agenda, histórico, estoque e financeiro em um só lugar
              </p>
            </CardContent>
          </Card>

          {/* Card 4 - Viralização/Conteúdo */}
          <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 hover:border-orange-400 opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Viralização / Conteúdo</CardTitle>
              </div>
              <CardDescription className="text-base">
                👉 Viralize e lote sua agenda!<br />
                <span className="font-semibold text-orange-600">Conteúdo pronto</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Conteúdo pronto para Reels e Instagram todos os dias
              </p>
              <p className="text-xs text-gray-500 mt-2 italic">Em breve...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
