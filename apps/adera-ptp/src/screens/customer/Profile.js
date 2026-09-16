import React from 'react';
import { ProfileScreen } from '@adera/ui';
import { useProfileSettings } from '@adera/ui/src/hooks/useProfileSettings';
import { useAppFlow } from '../../context/AppFlowContext';

const Profile = () => {
  const { user, menuItems, appVersion, ThemeSelectModal, LanguageSelectModal } = useProfileSettings('customer');
  const { openAppSelector } = useAppFlow();

  // Prepend a "Switch Apps" section to the menu sections
  const enhancedMenuItems = [
    {
      section: 'Switch Apps',
      items: [
        {
          id: 'switch-to-shop',
          label: 'Adera Shop',
          icon: 'storefront',
          onPress: openAppSelector,
        },
      ],
    },
    ...menuItems,
  ];

  return (
    <>
      <ThemeSelectModal />
      <LanguageSelectModal />
      <ProfileScreen user={user} menuItems={enhancedMenuItems} appVersion={appVersion} />
    </>
  );
};

export default Profile;
