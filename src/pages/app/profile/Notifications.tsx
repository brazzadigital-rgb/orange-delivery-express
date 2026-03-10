import { PageHeader } from '@/components/common/PageHeader';
import { NotificationSettings } from '@/components/profile/NotificationSettings';

export default function ProfileNotifications() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Notificações" />

      <div className="px-4 pb-8">
        <NotificationSettings />
      </div>
    </div>
  );
}
