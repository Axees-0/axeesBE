/**
 * Styled Alerts Utility
 * 
 * This utility provides functions to help migrate from native Alert.alert() 
 * to styled modal components throughout the application.
 * 
 * Usage:
 * 1. Import useAlertModal and/or useConfirmModal from @/components/ConfirmModal
 * 2. Replace Alert.alert() calls with showAlert() or showConfirm()
 * 3. Add the modal components to your JSX
 * 
 * Example:
 * ```tsx
 * import { useAlertModal, useConfirmModal } from '@/components/ConfirmModal';
 * 
 * const MyComponent = () => {
 *   const { showAlert, AlertModalComponent } = useAlertModal();
 *   const { showConfirm, ConfirmModalComponent } = useConfirmModal();
 * 
 *   // Simple alert (OK button only)
 *   const handleSimpleAlert = () => {
 *     showAlert('Title', 'Message', 'OK', () => console.log('dismissed'));
 *   };
 * 
 *   // Confirmation dialog (Cancel + Confirm buttons)
 *   const handleConfirm = () => {
 *     showConfirm('Title', 'Message', [
 *       { text: 'Cancel', style: 'cancel' },
 *       { text: 'Confirm', style: 'destructive', onPress: () => console.log('confirmed') }
 *     ]);
 *   };
 * 
 *   return (
 *     <>
 *       {/* Your component content */}
 *       <AlertModalComponent />
 *       <ConfirmModalComponent />
 *     </>
 *   );
 * };
 * ```
 */

// Migration mapping for common Alert.alert patterns:

/**
 * BEFORE: Alert.alert('Title', 'Message');
 * AFTER:  showAlert('Title', 'Message');
 */

/**
 * BEFORE: Alert.alert('Title', 'Message', [{ text: 'OK', onPress: () => {} }]);
 * AFTER:  showAlert('Title', 'Message', 'OK', () => {});
 */

/**
 * BEFORE: Alert.alert('Title', 'Message', [
 *           { text: 'Cancel', style: 'cancel' },
 *           { text: 'OK', onPress: () => {} }
 *         ]);
 * AFTER:  showConfirm('Title', 'Message', [
 *           { text: 'Cancel', style: 'cancel' },
 *           { text: 'OK', onPress: () => {} }
 *         ]);
 */

/**
 * BEFORE: Alert.alert('Title', 'Message', [
 *           { text: 'Cancel', style: 'cancel' },
 *           { text: 'Delete', style: 'destructive', onPress: () => {} }
 *         ]);
 * AFTER:  showConfirm('Title', 'Message', [
 *           { text: 'Cancel', style: 'cancel' },
 *           { text: 'Delete', style: 'destructive', onPress: () => {} }
 *         ]);
 */

export const migrationNotes = {
  completed: [
    'app/(tabs)/profile.tsx - Logout confirmation',
    'components/RoleSwitcher.tsx - Role switch confirmation and success alert', 
    'app/earnings/withdraw.tsx - All withdrawal validation and confirmation alerts',
    'app/deals/submit.tsx - Work submission validation and confirmation alerts'
  ],
  
  remaining: [
    'app/deals/proof.tsx - Proof upload validation and confirmation alerts',
    'app/offers/ directory - Offer-related validation and confirmation alerts',
    'app/login.tsx - Login error alerts',
    'app/register-*.tsx - Registration validation alerts',
    'Various other components with Alert.alert() calls'
  ],
  
  benefits: [
    'Consistent design with app theme',
    'Better accessibility support',
    'Enhanced user experience',
    'Cross-platform compatibility',
    'Keyboard navigation support (ESC key)',
    'Focus management for screen readers'
  ]
};