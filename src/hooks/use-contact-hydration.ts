'use client';

import { useEffect, useRef } from 'react';
import { useContactStore } from '@/stores/contact-store';
import { loadContacts } from '@/services/contacts/contactsApi';

export function useContactHydration() {
  const replaceContactState = useContactStore((state) => state.replaceContactState);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    void loadContacts()
      .then((snapshot) => replaceContactState(snapshot.groups, snapshot.contacts))
      .catch((error) => console.warn('Failed to hydrate contacts from database', error));
  }, [replaceContactState]);
}
