import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FeatureGate } from "@/components/auth/FeatureGate";
import { AppConfigProvider, useAppConfig } from "@/contexts/AppConfigContext";
import { FeatureProvider } from "@/contexts/FeatureContext";
import { StoreConfigProvider } from "@/contexts/StoreConfigContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { AppSplash } from "@/components/common/AppSplash";
import { VideoSplash } from "@/components/common/VideoSplash";
import { ServiceWorkerUpdate } from "@/components/pwa/ServiceWorkerUpdate";

// Layouts
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DriverLayout } from "@/layouts/DriverLayout";
import { OwnerLayout } from "@/layouts/OwnerLayout";

// Public Pages
import Landing from "@/pages/Landing";
import Onboarding from "@/pages/Onboarding";
import CreateStore from "@/pages/onboarding/CreateStore";
import NotFound from "@/pages/NotFound";
import AccessDenied from "@/pages/AccessDenied";
import SessionExpired from "@/pages/SessionExpired";

// Auth Pages
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import OwnerSignup from "@/pages/auth/OwnerSignup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Logout from "@/pages/auth/Logout";

// Customer App Pages
import AppHome from "@/pages/app/Home";
import Category from "@/pages/app/Category";
import SearchPage from "@/pages/app/Search";
import ProductDetail from "@/pages/app/ProductDetail";
import Cart from "@/pages/app/Cart";
// Old Checkout is deprecated - using new checkout flow
import Orders from "@/pages/app/Orders";
import OrderDetail from "@/pages/app/OrderDetail";
import OrderTrack from "@/pages/app/OrderTrack";
import Profile from "@/pages/app/Profile";
import Addresses from "@/pages/app/Addresses";
import AddressForm from "@/pages/app/AddressForm";
import Favorites from "@/pages/app/Favorites";
import Notifications from "@/pages/app/Notifications";
import Support from "@/pages/app/Support";
import PaymentMethods from "@/pages/app/PaymentMethods";
import StoreHours from "@/pages/app/StoreHours";

// Profile Settings Pages
import ProfileEdit from "@/pages/app/profile/Edit";
import ProfileSecurity from "@/pages/app/profile/Security";
import ProfileNotifications from "@/pages/app/profile/Notifications";

// Checkout Flow Pages
import CheckoutAddress from "@/pages/app/checkout/Address";
import CheckoutDelivery from "@/pages/app/checkout/Delivery";
import CheckoutPayment from "@/pages/app/checkout/Payment";
import CheckoutReview from "@/pages/app/checkout/Review";
import CheckoutSuccess from "@/pages/app/checkout/Success";
import CheckoutFailure from "@/pages/app/checkout/Failure";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminOrders from "@/pages/admin/Orders";
import AdminKitchen from "@/pages/admin/Kitchen";
import AdminProducts from "@/pages/admin/Products";
import AdminCategories from "@/pages/admin/Categories";
import AdminCoupons from "@/pages/admin/Coupons";
import AdminCustomers from "@/pages/admin/Customers";
import AdminDrivers from "@/pages/admin/Drivers";
import AdminDriverForm from "@/pages/admin/DriverForm";
import AdminSettings from "@/pages/admin/Settings";
import AdminPromotions from "@/pages/admin/Promotions";
import AdminPromotionForm from "@/pages/admin/PromotionForm";
import AdminBanners from "@/pages/admin/Banners";
import AdminOrderDetail from "@/pages/admin/OrderDetail";
import AdminLiveMap from "@/pages/admin/LiveMap";

// Management Pages
import ManagementOverview from "@/pages/admin/management/Overview";
import AdminDeliveryZones from "@/pages/admin/DeliveryZones";
import ManagementCustomers from "@/pages/admin/management/Customers";
import ManagementFinance from "@/pages/admin/management/Finance";
import ManagementOperations from "@/pages/admin/management/Operations";
import ReportProducts from "@/pages/admin/management/ReportProducts";
import ReportSales from "@/pages/admin/management/ReportSales";
import AdminAppSettings from "@/pages/admin/AppSettings";

// Integration Pages
import AdminIntegrations from "@/pages/admin/Integrations";
import AdminIFoodIntegration from "@/pages/admin/IFoodIntegration";
import IFoodDocumentation from "@/pages/admin/docs/IFoodDocumentation";
import SetupDocumentation from "@/pages/admin/docs/SetupDocumentation";

// PWA Pages
import Offline from "@/pages/Offline";
import Maintenance from "@/pages/Maintenance";
import PWAInstall from "@/pages/pwa/Install";
 import PushDebug from "@/pages/app/debug/Push";

  // SaaS Pages
  import Plans from "@/pages/Plans";
  import Features from "@/pages/Features";

 // Pizza Builder v2 Pages
 import PizzaSizes from "@/pages/app/pizza/PizzaSizes";
 import PizzaFlavors from "@/pages/app/pizza/PizzaFlavors";
 import PizzaAddons from "@/pages/app/pizza/PizzaAddons";

 // Admin Pizza Builder Pages
 import AdminPizzaBuilderSettings from "@/pages/admin/pizza-builder/Settings";
 import AdminPizzaBuilderSizes from "@/pages/admin/pizza-builder/Sizes";
 import AdminPizzaBuilderFlavors from "@/pages/admin/pizza-builder/Flavors";
 import AdminPizzaBuilderPrices from "@/pages/admin/pizza-builder/Prices";
 import AdminPizzaBuilderAddons from "@/pages/admin/pizza-builder/Addons";

// Admin Print Pages
import OrderPrint from "@/pages/admin/print/OrderPrint";
import TestPrint from "@/pages/admin/print/TestPrint";
 
 // Admin Loyalty Pages
 import AdminLoyaltySettings from "@/pages/admin/loyalty/Settings";
 import AdminLoyaltyRewards from "@/pages/admin/loyalty/Rewards";
 import AdminLoyaltyCustomers from "@/pages/admin/loyalty/Customers";
 import AdminLoyaltyReports from "@/pages/admin/loyalty/Reports";
import AdminReviews from "@/pages/admin/Reviews";
import AdminAdmins from "@/pages/admin/Admins";
 
 // Customer Loyalty Page
 import Loyalty from "@/pages/app/Loyalty";
  import AppReviews from "@/pages/app/Reviews";
  
  // Kitchen Display (Standalone KDS)
  import KitchenDisplay from "@/pages/KitchenDisplay";

// Billing / Subscription
import AdminBilling from "@/pages/admin/Billing";
import AdminSubscription from "@/pages/admin/Subscription";
import BillingExpired from "@/pages/BillingExpired";
import SubscriptionExpired from "@/pages/SubscriptionExpired";
import Billing from "@/pages/Billing";
import { BillingGateGuard } from "@/components/billing/BillingGateGuard";

// Client Subscription Pages
import MySubscription from "@/pages/subscription/MySubscription";
import SubscriptionHistory from "@/pages/subscription/SubscriptionHistory";
import SubscriptionExpiredClient from "@/pages/subscription/SubscriptionExpiredClient";
import SubscriptionManage from "@/pages/subscription/SubscriptionManage";

// Owner Subscription Pages
import OwnerSubscriptions from "@/pages/owner/OwnerSubscriptions";
import OwnerSubscriptionDetail from "@/pages/owner/OwnerSubscriptionDetail";
import OwnerSubscriptionReports from "@/pages/owner/OwnerSubscriptionReports";
import OwnerManageAdmins from "@/pages/owner/OwnerManageAdmins";
import OwnerPaymentSettings from "@/pages/owner/OwnerPaymentSettings";
import OwnerPlans from "@/pages/owner/OwnerPlans";
import OwnerPurchaseOrders from "@/pages/owner/OwnerPurchaseOrders";
import OwnerStoreFeatures from "@/pages/owner/OwnerStoreFeatures";
import OwnerVouchers from "@/pages/owner/OwnerVouchers";
import OwnerPlatformSettings from "@/pages/owner/OwnerPlatformSettings";
  
// Driver Pages
import DriverHome from "@/pages/driver/Home";
import DriverOrders from "@/pages/driver/Orders";
import DriverOrderDetail from "@/pages/driver/OrderDetail";
import DriverNavigation from "@/pages/driver/Navigation";
import DriverProfile from "@/pages/driver/Profile";

// Table Order Pages (QR Code)
import TableMenu from "@/pages/table/TableMenu";
import TableOrderStatus from "@/pages/table/TableOrderStatus";
import TableClosed from "@/pages/table/TableClosed";
import TableQREntry from "@/pages/table/TableQREntry";
import TableSessionMenu from "@/pages/table/TableSessionMenu";
import TableSessionOrderStatus from "@/pages/table/TableSessionOrderStatus";
import TableSessionExpired from "@/pages/table/TableSessionExpired";
import TableSessionClosed from "@/pages/table/TableSessionClosed";

// Waiter Pages
import { WaiterLayout } from "@/layouts/WaiterLayout";
import WaiterOrders from "@/pages/waiter/WaiterOrders";
import WaiterTables from "@/pages/waiter/WaiterTables";
import WaiterTableSession from "@/pages/waiter/WaiterTableSession";
import WaiterProfile from "@/pages/waiter/WaiterProfile";

// Admin Table Management
import AdminTables from "@/pages/admin/Tables";
import AdminWaiters from "@/pages/admin/Waiters";
import AdminCalls from "@/pages/admin/Calls";
import TableSessionDetail from "@/pages/admin/TableSessionDetail";
import TableSessionReceipt from "@/pages/admin/TableSessionReceipt";

// Waiter Calls
import WaiterCalls from "@/pages/waiter/WaiterCalls";

// Known base domains for the SaaS portal (root domains, not tenant subdomains)
const PORTAL_BASE_DOMAINS = ['deliverylitoral.com.br'];

// Detects if on store subdomain vs portal and redirects accordingly
function RootRedirect() {
  const host = window.location.hostname.split(':')[0];
  const { user } = useAuth();
  
  // Direct matches: localhost, IP, Lovable preview domains
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host) 
    || host.endsWith('.lovable.app') || host.endsWith('.lovableproject.com')) {
    return <Plans />;
  }

  // Known portal domains (including www variant)
  if (PORTAL_BASE_DOMAINS.some(d => host === d || host === `www.${d}`)) {
    return <Plans />;
  }

  // System subdomains on known portal domains
  const PORTAL_HOSTS = ['app', 'www', 'admin', 'api'];
  if (PORTAL_BASE_DOMAINS.some(d => {
    const suffix = `.${d}`;
    if (host.endsWith(suffix)) {
      const sub = host.slice(0, -suffix.length);
      return PORTAL_HOSTS.includes(sub);
    }
    return false;
  })) {
    return <Plans />;
  }

  // Tenant subdomain or custom domain — if user is logged in, check their role
  if (user) {
    return <SmartTenantRedirect userId={user.id} />;
  }

  // Not logged in → customer app
  return <Navigate to="/app/home" replace />;
}

// Redirects logged-in users to admin or app based on their store role
function SmartTenantRedirect({ userId }: { userId: string }) {
  const { data: redirectTarget, isLoading } = useQuery({
    queryKey: ['user-store-redirect', userId],
    queryFn: async () => {
      // Check store_users roles
      const { data: storeRolesData } = await supabase
        .from('store_users')
        .select('role')
        .eq('user_id', userId);

      const roles = new Set(storeRolesData?.map(r => r.role));
      if (roles.has('owner') || roles.has('admin') || roles.has('staff')) {
        return '/admin';
      }

      // Check if user is store owner via owner_email
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: ownedStore } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_email', user.email)
          .limit(1)
          .maybeSingle();

        if (ownedStore) return '/admin';
      }

      return '/app/home';
    },
    staleTime: 60_000,
  });

  if (isLoading) return null;

  return <Navigate to={redirectTarget || '/app/home'} replace />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    },
  },
});

// Inner component that uses AppConfig context
function AppContent() {
  const { isLoading, isReady } = useAppConfig();
  const location = useLocation();
  const currentPath = location.pathname;

  // Skip splash for auth, plans, and onboarding routes — they handle their own loading
  const skipSplash = currentPath.startsWith('/auth') || currentPath === '/' || currentPath === '/planos' || currentPath.startsWith('/onboarding');

  // Show neutral splash while loading config (except on routes that don't need it)
  if (isLoading && !isReady && !skipSplash) {
    return <AppSplash />;
  }

  return (
    <>
      <ServiceWorkerUpdate />
      <Routes>
        {/* Public - Root route: store subdomain → customer app, portal → marketing */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/onboarding/create-store" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'owner']}>
            <CreateStore />
          </ProtectedRoute>
        } />
        <Route path="/minha-loja" element={<AccessDenied />} />
        <Route path="/session-expired" element={<SessionExpired />} />
        <Route path="/offline" element={<Offline />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/pwa/install" element={<PWAInstall />} />
         <Route path="/planos" element={<Plans />} />
         <Route path="/expired" element={<BillingExpired />} />
         <Route path="/billing" element={<Billing />} />
         <Route path="/funcionalidades" element={<Features />} />
         <Route path="/billing/expired" element={<BillingExpired />} />
         <Route path="/subscription/expired" element={<SubscriptionExpiredClient />} />
         
         {/* Client Subscription Routes */}
         <Route path="/subscription" element={
           <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
             <MySubscription />
           </ProtectedRoute>
         } />
         <Route path="/subscription/history" element={
           <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
             <SubscriptionHistory />
           </ProtectedRoute>
         } />
         <Route path="/subscription/manage" element={
           <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
             <SubscriptionManage />
           </ProtectedRoute>
         } />
         
         {/* Kitchen Display (Standalone KDS for kitchen monitors) */}
          <Route path="/kitchen-display" element={<KitchenDisplay />} />
          
          {/* Table Order Routes - Legacy QR Code entry (Feature Gated) */}
          <Route path="/t/:token" element={<FeatureGate feature="table_service"><TableQREntry /></FeatureGate>} />
          <Route path="/t/:token/status/:orderId" element={<FeatureGate feature="table_service"><TableOrderStatus /></FeatureGate>} />
          <Route path="/t/:token/closed" element={<FeatureGate feature="table_service"><TableClosed /></FeatureGate>} />
          
          {/* Session Token Protected Routes (Feature Gated) */}
          <Route path="/s/:sessionToken/menu" element={<FeatureGate feature="table_service"><TableSessionMenu /></FeatureGate>} />
          <Route path="/s/:sessionToken/status/:orderId" element={<FeatureGate feature="table_service"><TableSessionOrderStatus /></FeatureGate>} />
          <Route path="/s/:sessionToken/expired" element={<FeatureGate feature="table_service"><TableSessionExpired /></FeatureGate>} />
          <Route path="/s/:sessionToken/closed" element={<FeatureGate feature="table_service"><TableSessionClosed /></FeatureGate>} />
         
        {/* Auth */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/signup/lojista" element={<OwnerSignup />} />
        <Route path="/auth/forgot" element={<ForgotPassword />} />
        <Route path="/auth/logout" element={<Logout />} />

        {/* Customer App - Public routes */}
        <Route path="/app" element={<CustomerLayout />}>
          <Route index element={<Navigate to="/app/home" replace />} />
          <Route path="home" element={<AppHome />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="category/:slug" element={<Category />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          {/* Pizza Builder v2 */}
          <Route path="pizza" element={<PizzaSizes />} />
          <Route path="pizza/sabores" element={<PizzaFlavors />} />
          <Route path="pizza/adicionais" element={<PizzaAddons />} />
          <Route path="store-hours" element={<StoreHours />} />
        </Route>

        {/* Customer App - Protected checkout routes (allow driver too) */}
        <Route path="/app/checkout" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CheckoutAddress />
          </ProtectedRoute>
        } />
        <Route path="/app/checkout/address" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CheckoutAddress />
          </ProtectedRoute>
        } />
        <Route path="/app/checkout/delivery" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CheckoutDelivery />
          </ProtectedRoute>
        } />
        <Route path="/app/checkout/payment" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CheckoutPayment />
          </ProtectedRoute>
        } />
        <Route path="/app/checkout/review" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CheckoutReview />
          </ProtectedRoute>
        } />
        <Route path="/app/checkout/success" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CheckoutSuccess />
          </ProtectedRoute>
        } />
        <Route path="/app/checkout/failure" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CheckoutFailure />
          </ProtectedRoute>
        } />
        
        {/* Customer App - Protected profile routes (allow driver too) */}
        <Route path="/app/orders" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CustomerLayout><Orders /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/orders/:id" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CustomerLayout><OrderDetail /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/orders/:id/track" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CustomerLayout><OrderTrack /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/favorites" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CustomerLayout><Favorites /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/notifications" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CustomerLayout><Notifications /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/profile" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CustomerLayout><Profile /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/profile/edit" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CustomerLayout><ProfileEdit /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/profile/security" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CustomerLayout><ProfileSecurity /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/profile/notifications" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CustomerLayout><ProfileNotifications /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/profile/addresses" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CustomerLayout><Addresses /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/profile/addresses/:id" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CustomerLayout><AddressForm /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/support" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CustomerLayout><Support /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/app/profile/payments" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
            <CustomerLayout><PaymentMethods /></CustomerLayout>
          </ProtectedRoute>
        } />
         
         {/* Debug routes */}
         <Route path="/app/debug/push" element={
           <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
             <CustomerLayout><PushDebug /></CustomerLayout>
           </ProtectedRoute>
         } />
 
         {/* Loyalty Route */}
         <Route path="/app/loyalty" element={
           <ProtectedRoute allowedRoles={['customer', 'admin', 'staff', 'driver']}>
             <CustomerLayout><Loyalty /></CustomerLayout>
           </ProtectedRoute>
         } />
         
         {/* App Reviews Route */}
         <Route path="/app/reviews" element={
           <CustomerLayout><AppReviews /></CustomerLayout>
         } />

        {/* Admin Print Routes - No ProtectedRoute wrapper, auth checked internally */}
        <Route path="/admin/print/order/:id" element={<OrderPrint />} />
        <Route path="/admin/print/test" element={<TestPrint />} />
        <Route path="/admin/table-session/:id/receipt" element={<TableSessionReceipt />} />

        {/* Admin - Protected + Store Scoped */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']} requireStoreAccess>
            <BillingGateGuard>
              <AdminLayout />
            </BillingGateGuard>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="kitchen" element={<AdminKitchen />} />
          <Route path="menu/products" element={<AdminProducts />} />
          <Route path="menu/categories" element={<AdminCategories />} />
          <Route path="promotions" element={<AdminPromotions />} />
          <Route path="promotions/new" element={<AdminPromotionForm />} />
          <Route path="promotions/:id" element={<AdminPromotionForm />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="drivers" element={<FeatureGate feature="courier_app"><AdminDrivers /></FeatureGate>} />
          <Route path="drivers/new" element={<FeatureGate feature="courier_app"><AdminDriverForm /></FeatureGate>} />
          <Route path="drivers/:id" element={<FeatureGate feature="courier_app"><AdminDriverForm /></FeatureGate>} />
          <Route path="live-map" element={<FeatureGate feature="courier_app"><AdminLiveMap /></FeatureGate>} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="delivery-zones" element={<AdminDeliveryZones />} />
          <Route path="app-settings" element={<AdminAppSettings />} />
          {/* Management Routes */}
          <Route path="management/overview" element={<ManagementOverview />} />
          <Route path="management/customers" element={<ManagementCustomers />} />
          <Route path="management/finance" element={<ManagementFinance />} />
          <Route path="management/operations" element={<ManagementOperations />} />
          <Route path="management/reports/products" element={<ReportProducts />} />
          <Route path="management/reports/sales" element={<ReportSales />} />
          {/* Integration Routes */}
          <Route path="integrations" element={<AdminIntegrations />} />
          <Route path="integrations/ifood" element={<AdminIFoodIntegration />} />
           <Route path="docs/ifood-integration" element={<IFoodDocumentation />} />
           <Route path="docs/setup" element={<SetupDocumentation />} />
          {/* Pizza Builder Admin */}
          <Route path="pizza-builder" element={<AdminPizzaBuilderSettings />} />
          <Route path="pizza-builder/settings" element={<AdminPizzaBuilderSettings />} />
          <Route path="pizza-builder/sizes" element={<AdminPizzaBuilderSizes />} />
          <Route path="pizza-builder/flavors" element={<AdminPizzaBuilderFlavors />} />
          <Route path="pizza-builder/prices" element={<AdminPizzaBuilderPrices />} />
          <Route path="pizza-builder/addons" element={<AdminPizzaBuilderAddons />} />
           {/* Loyalty Routes - Feature Gated */}
           <Route path="loyalty" element={<FeatureGate feature="loyalty_points"><AdminLoyaltySettings /></FeatureGate>} />
           <Route path="loyalty/settings" element={<FeatureGate feature="loyalty_points"><AdminLoyaltySettings /></FeatureGate>} />
           <Route path="loyalty/rewards" element={<FeatureGate feature="loyalty_points"><AdminLoyaltyRewards /></FeatureGate>} />
           <Route path="loyalty/customers" element={<FeatureGate feature="loyalty_points"><AdminLoyaltyCustomers /></FeatureGate>} />
           <Route path="loyalty/reports" element={<FeatureGate feature="loyalty_points"><AdminLoyaltyReports /></FeatureGate>} />
           {/* Reviews Route */}
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="admins" element={<AdminAdmins />} />
            <Route path="billing" element={<AdminBilling />} />
             <Route path="subscription" element={<AdminSubscription />} />
             {/* Table Orders - Feature Gated */}
               <Route path="tables" element={<FeatureGate feature="table_service"><AdminTables /></FeatureGate>} />
               <Route path="table-session/:id" element={<FeatureGate feature="table_service"><TableSessionDetail /></FeatureGate>} />
               <Route path="waiters" element={<FeatureGate feature="waiter_app"><AdminWaiters /></FeatureGate>} />
               <Route path="calls" element={<FeatureGate feature="table_service"><AdminCalls /></FeatureGate>} />
           <Route path="*" element={<AdminDashboard />} />
        </Route>

        {/* Owner - Protected (owner role only, cannot see admin panel) */}
        <Route path="/owner" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/owner/subscriptions" replace />} />
          <Route path="subscriptions" element={<OwnerSubscriptions />} />
          <Route path="subscriptions/:storeId" element={<OwnerSubscriptionDetail />} />
          <Route path="subscriptions/reports" element={<OwnerSubscriptionReports />} />
          <Route path="payment-settings" element={<OwnerPaymentSettings />} />
          <Route path="plans" element={<OwnerPlans />} />
          <Route path="purchase-orders" element={<OwnerPurchaseOrders />} />
          <Route path="store-features" element={<OwnerStoreFeatures />} />
          <Route path="vouchers" element={<OwnerVouchers />} />
          <Route path="manage-admins" element={<OwnerManageAdmins />} />
          <Route path="platform" element={<OwnerPlatformSettings />} />
        </Route>

        {/* Waiter - Protected */}
        <Route path="/waiter" element={
          <ProtectedRoute allowedRoles={['waiter', 'admin', 'staff']} fallbackTo="/app/home" requireStoreAccess>
            <FeatureGate feature="waiter_app">
              <WaiterLayout />
            </FeatureGate>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/waiter/orders" replace />} />
          <Route path="orders" element={<WaiterOrders />} />
           <Route path="tables" element={<WaiterTables />} />
           <Route path="table-session/:id" element={<WaiterTableSession />} />
           <Route path="calls" element={<WaiterCalls />} />
          <Route path="profile" element={<WaiterProfile />} />
        </Route>

        {/* Driver - Protected (admin/staff can also view) */}
        <Route path="/driver" element={
          <ProtectedRoute allowedRoles={['driver', 'admin', 'staff']} fallbackTo="/app/home" requireStoreAccess>
            <FeatureGate feature="courier_app">
              <DriverLayout />
            </FeatureGate>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/driver/home" replace />} />
          <Route path="home" element={<DriverHome />} />
          <Route path="orders" element={<DriverOrders />} />
          <Route path="orders/:id" element={<DriverOrderDetail />} />
          <Route path="navigation/:id" element={<DriverNavigation />} />
          <Route path="profile" element={<DriverProfile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TenantProvider>
      <AuthProvider>
        <AppConfigProvider>
          <StoreConfigProvider>
            <FeatureProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner position="top-center" />
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
              </TooltipProvider>
            </FeatureProvider>
          </StoreConfigProvider>
        </AppConfigProvider>
      </AuthProvider>
    </TenantProvider>
  </QueryClientProvider>
);

export default App;
