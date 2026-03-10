 import { useState } from 'react';
 import { usePushNotifications } from '@/hooks/usePushNotifications';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { 
   Bell, 
   BellOff, 
   CheckCircle2, 
   XCircle, 
   AlertCircle,
   RefreshCw,
   Send,
   Smartphone,
   Settings,
   Loader2
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useAuth } from '@/hooks/useAuth';
 import { Navigate } from 'react-router-dom';
 
 function StatusBadge({ 
   status, 
   label 
 }: { 
   status: 'ok' | 'warning' | 'error' | 'unknown'; 
   label: string 
 }) {
   const variants = {
    ok: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
    error: 'bg-destructive/10 text-destructive border-destructive/20',
    unknown: 'bg-muted text-muted-foreground border-border',
   };
 
   const icons = {
     ok: <CheckCircle2 className="w-3 h-3" />,
     warning: <AlertCircle className="w-3 h-3" />,
     error: <XCircle className="w-3 h-3" />,
     unknown: <AlertCircle className="w-3 h-3" />,
   };
 
   return (
     <Badge 
       variant="outline" 
       className={cn('flex items-center gap-1', variants[status])}
     >
       {icons[status]}
       {label}
     </Badge>
   );
 }
 
 function DiagnosticRow({ 
   label, 
   value, 
   status 
 }: { 
   label: string; 
   value: string; 
   status: 'ok' | 'warning' | 'error' | 'unknown' 
 }) {
   return (
     <div className="flex items-center justify-between py-2 border-b last:border-0">
       <span className="text-sm text-muted-foreground">{label}</span>
       <StatusBadge status={status} label={value} />
     </div>
   );
 }
 
 export default function PushDebugPage() {
   const { user } = useAuth();
   const {
     diagnostics,
     isLoading,
     requestPermission,
     subscribe,
     unsubscribe,
     sendTestPush,
     refresh,
   } = usePushNotifications();
 
   const [isSendingTest, setIsSendingTest] = useState(false);
   const [isSubscribing, setIsSubscribing] = useState(false);
 
   if (!user) {
     return <Navigate to="/auth/login" replace />;
   }
 
   const handleSubscribe = async () => {
     setIsSubscribing(true);
     await subscribe();
     setIsSubscribing(false);
   };
 
   const handleUnsubscribe = async () => {
     setIsSubscribing(true);
     await unsubscribe();
     setIsSubscribing(false);
   };
 
   const handleSendTest = async () => {
     setIsSendingTest(true);
     await sendTestPush();
     setIsSendingTest(false);
   };
 
   const getPermissionStatus = (): 'ok' | 'warning' | 'error' | 'unknown' => {
     if (diagnostics.permission === 'granted') return 'ok';
     if (diagnostics.permission === 'denied') return 'error';
     if (diagnostics.permission === 'default') return 'warning';
     return 'unknown';
   };
 
   const isFullyConfigured = 
     diagnostics.permission === 'granted' &&
     diagnostics.serviceWorkerActive &&
     diagnostics.subscriptionExists;
 
   return (
     <div className="min-h-screen bg-background p-4 pb-20">
       <div className="max-w-lg mx-auto space-y-4">
         <div className="flex items-center gap-3 mb-6">
           <Bell className="w-8 h-8 text-primary" />
           <div>
             <h1 className="text-xl font-bold">Push Notifications</h1>
             <p className="text-sm text-muted-foreground">Diagnóstico e teste</p>
           </div>
         </div>
 
         {/* Status Overview */}
         <Card>
           <CardHeader className="pb-3">
             <div className="flex items-center justify-between">
               <CardTitle className="text-lg">Status Geral</CardTitle>
               <Button variant="ghost" size="icon" onClick={refresh} disabled={isLoading}>
                 <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
               </Button>
             </div>
           </CardHeader>
           <CardContent>
             <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
               {isFullyConfigured ? (
                 <>
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                   <div>
                    <p className="font-medium text-emerald-700 dark:text-emerald-300">Tudo configurado!</p>
                     <p className="text-sm text-muted-foreground">
                       Push notifications estão funcionando
                     </p>
                   </div>
                 </>
               ) : (
                 <>
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                   <div>
                    <p className="font-medium text-amber-700 dark:text-amber-300">Configuração incompleta</p>
                     <p className="text-sm text-muted-foreground">
                       Siga os passos abaixo para ativar
                     </p>
                   </div>
                 </>
               )}
             </div>
           </CardContent>
         </Card>
 
         {/* Diagnostics */}
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-lg flex items-center gap-2">
               <Settings className="w-5 h-5" />
               Diagnóstico
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-0">
             <DiagnosticRow
               label="Permissão de notificação"
               value={diagnostics.permission}
               status={getPermissionStatus()}
             />
             <DiagnosticRow
               label="Service Worker registrado"
               value={diagnostics.serviceWorkerRegistered ? 'Sim' : 'Não'}
               status={diagnostics.serviceWorkerRegistered ? 'ok' : 'error'}
             />
             <DiagnosticRow
               label="Service Worker ativo"
               value={diagnostics.serviceWorkerActive ? 'Sim' : 'Não'}
               status={diagnostics.serviceWorkerActive ? 'ok' : 'warning'}
             />
             <DiagnosticRow
               label="Subscription ativa"
               value={diagnostics.subscriptionExists ? 'Sim' : 'Não'}
               status={diagnostics.subscriptionExists ? 'ok' : 'warning'}
             />
            <DiagnosticRow
              label="VAPID key configurada"
              value={diagnostics.vapidKeyAvailable ? 'Sim' : 'Não'}
              status={diagnostics.vapidKeyAvailable ? 'ok' : 'error'}
            />
             {diagnostics.serviceWorkerScope && (
               <div className="pt-2 text-xs text-muted-foreground">
                 Scope: {diagnostics.serviceWorkerScope}
               </div>
             )}
             {diagnostics.subscriptionEndpoint && (
               <div className="pt-1 text-xs text-muted-foreground font-mono">
                 Endpoint: ...{diagnostics.subscriptionEndpoint}
               </div>
             )}
             {diagnostics.lastError && (
               <div className="pt-2 text-xs text-red-600">
                 Erro: {diagnostics.lastError}
               </div>
             )}
           </CardContent>
         </Card>
 
         {/* Actions */}
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-lg flex items-center gap-2">
               <Smartphone className="w-5 h-5" />
               Ações
             </CardTitle>
             <CardDescription>
               Configure e teste as notificações push
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-3">
             {diagnostics.permission !== 'granted' && (
               <Button 
                 onClick={requestPermission} 
                 className="w-full"
                 variant="outline"
               >
                 <Bell className="w-4 h-4 mr-2" />
                 Solicitar permissão
               </Button>
             )}
 
             {!diagnostics.subscriptionExists ? (
               <Button 
                 onClick={handleSubscribe} 
                 className="w-full"
                 disabled={isSubscribing || diagnostics.permission === 'denied'}
               >
                 {isSubscribing ? (
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 ) : (
                   <Bell className="w-4 h-4 mr-2" />
                 )}
                 Ativar push notifications
               </Button>
             ) : (
               <Button 
                 onClick={handleUnsubscribe} 
                 variant="outline"
                 className="w-full"
                 disabled={isSubscribing}
               >
                 {isSubscribing ? (
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 ) : (
                   <BellOff className="w-4 h-4 mr-2" />
                 )}
                 Desativar push notifications
               </Button>
             )}
 
             <div className="pt-2">
               <Button
                 onClick={handleSendTest}
                 variant="default"
                 className="w-full"
                 disabled={!isFullyConfigured || isSendingTest}
               >
                 {isSendingTest ? (
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 ) : (
                   <Send className="w-4 h-4 mr-2" />
                 )}
                 Enviar push de teste
               </Button>
               {!isFullyConfigured && (
                 <p className="text-xs text-muted-foreground mt-2 text-center">
                   Complete a configuração para testar
                 </p>
               )}
             </div>
           </CardContent>
         </Card>
 
         {/* iOS Warning */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
           <CardContent className="pt-4">
             <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
               <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">Nota para iOS</p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                   No iPhone/iPad, push notifications só funcionam quando o app 
                   está instalado na tela inicial (PWA). Toque em "Compartilhar" → 
                   "Adicionar à Tela de Início".
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }