 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useStoreId } from '@/contexts/TenantContext';
 import { toast } from 'sonner';
 
 export interface PrintSettings {
   id: string;
   store_id: string;
   printer_enabled: boolean;
   paper_size: '80mm' | '58mm';
   auto_print_new_orders: boolean;
   auto_print_copies: number;
   print_on_status: 'created' | 'accepted';
   print_templates_enabled: {
     kitchen: boolean;
     counter: boolean;
     delivery: boolean;
   };
   header_logo_url: string | null;
   footer_message: string | null;
   show_prices_on_kitchen: boolean;
   show_qr_pickup: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export interface PrintJob {
   id: string;
   store_id: string;
   order_id: string;
   template: 'kitchen' | 'counter' | 'delivery';
   copies: number;
   status: 'queued' | 'printed' | 'failed';
   is_reprint: boolean;
   printed_at: string | null;
   error_message: string | null;
   created_at: string;
   created_by: string | null;
 }
 
 export function usePrintSettings() {
   const storeId = useStoreId();
   return useQuery({
     queryKey: ['print-settings', storeId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('store_print_settings')
         .select('*')
         .eq('store_id', storeId)
         .maybeSingle();
 
       if (error) throw error;
       return data as PrintSettings | null;
     },
   });
 }
 
 export function useUpdatePrintSettings() {
   const storeId = useStoreId();
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (settings: Partial<PrintSettings>) => {
       const { data, error } = await supabase
         .from('store_print_settings')
         .upsert(
           { store_id: storeId, ...settings },
           { onConflict: 'store_id' }
         )
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['print-settings'] });
       toast.success('Configurações salvas!');
     },
     onError: () => {
       toast.error('Erro ao salvar configurações');
     },
   });
 }
 
 export function useOrderPrintJobs(orderId: string) {
   return useQuery({
     queryKey: ['print-jobs', orderId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('order_print_jobs')
         .select('*')
         .eq('order_id', orderId)
         .order('created_at', { ascending: false });
 
       if (error) throw error;
       return data as PrintJob[];
     },
     enabled: !!orderId,
   });
 }
 
 export function useCreatePrintJob() {
   const storeId = useStoreId();
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async ({
       orderId,
       template,
       copies = 1,
       isReprint = false,
     }: {
       orderId: string;
       template: 'kitchen' | 'counter' | 'delivery';
       copies?: number;
       isReprint?: boolean;
     }) => {
       const { data: user } = await supabase.auth.getUser();
 
       const { data, error } = await supabase
         .from('order_print_jobs')
         .insert({
           store_id: storeId,
           order_id: orderId,
           template,
           copies,
           is_reprint: isReprint,
           status: 'queued',
           created_by: user?.user?.id,
         })
         .select()
         .single();
 
       if (error) throw error;
       return data as PrintJob;
     },
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ['print-jobs', variables.orderId] });
     },
   });
 }
 
 export function useUpdatePrintJob() {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async ({
       jobId,
       status,
       errorMessage,
     }: {
       jobId: string;
       status: 'printed' | 'failed';
       errorMessage?: string;
     }) => {
       const { data, error } = await supabase
         .from('order_print_jobs')
         .update({
           status,
           printed_at: status === 'printed' ? new Date().toISOString() : null,
           error_message: errorMessage,
         })
         .eq('id', jobId)
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
     },
   });
 }
 
 export function useHasPrintedTemplate(orderId: string, template: 'kitchen' | 'counter' | 'delivery') {
   return useQuery({
     queryKey: ['print-jobs', orderId, template, 'printed'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('order_print_jobs')
         .select('id')
         .eq('order_id', orderId)
         .eq('template', template)
         .eq('status', 'printed')
         .limit(1);
 
       if (error) throw error;
       return data.length > 0;
     },
     enabled: !!orderId,
   });
 }