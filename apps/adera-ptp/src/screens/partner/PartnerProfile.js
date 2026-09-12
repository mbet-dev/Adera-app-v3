import React from 'react';
import { ProfileScreen } from '@adera/ui';
import { useProfileSettings } from '@adera/ui/src/hooks/useProfileSettings';

const PartnerProfile = () => {
  const { user, menuItems, appVersion, ThemeSelectModal, LanguageSelectModal } = useProfileSettings('partner');
  return (
    <>
      <ThemeSelectModal />
      <LanguageSelectModal />
      <ProfileScreen user={user} menuItems={menuItems} appVersion={appVersion} />
    </>
  );
};

export default PartnerProfile;
