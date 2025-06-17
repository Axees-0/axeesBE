/**
 * Base router entry for /UOEPM04AddNewMethodCreator
 * Delegates to the platform‑specific implementation.
 */
import { Platform } from 'react-native';

export default Platform.OS === 'web'
  ? require('./UOEPM04AddNewMethodCreator.web').default
  : require('./UOEPM04AddNewMethodCreator.native').default;
