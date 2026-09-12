import React from 'react';
import { ProfileScreen } from '@adera/ui';
import { useProfileSettings } from '@adera/ui/src/hooks/useProfileSettings';

const DriverProfile = () => {
  const { user, menuItems, appVersion, ThemeSelectModal, LanguageSelectModal } = useProfileSettings('driver');
  return (
    <>
      <ThemeSelectModal />
      <LanguageSelectModal />
      <ProfileScreen user={user} menuItems={menuItems} appVersion={appVersion} />
    </>
  );
};

export default DriverProfile;
