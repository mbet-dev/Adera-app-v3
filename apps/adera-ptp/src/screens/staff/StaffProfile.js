import React from 'react';
import { Alert } from 'react-native';
import { ProfileScreen } from '@adera/ui';
import { useAuth } from '@adera/auth';
import { usePreferences } from '@adera/preferences';
import { useProfileSettings } from '@adera/ui/src/hooks/useProfileSettings';

const StaffProfile = () => {
  const { user, menuItems, appVersion, ThemeSelectModal, LanguageSelectModal } = useProfileSettings('staff');
  return (
    <>
      <ThemeSelectModal />
      <LanguageSelectModal />
      <ProfileScreen user={user} menuItems={menuItems} appVersion={appVersion} />
    </>
  );
};

export default StaffProfile;
