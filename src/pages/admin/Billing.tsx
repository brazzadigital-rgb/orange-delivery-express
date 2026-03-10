// This file redirects to the new Subscription page for backward compatibility
import { Navigate } from 'react-router-dom';

export default function AdminBilling() {
  return <Navigate to="/admin/subscription" replace />;
}
