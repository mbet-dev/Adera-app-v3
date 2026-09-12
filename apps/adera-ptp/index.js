import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

// Use stabilized root for web platform
const AppRoot = Platform.OS === 'web' 
  ? require('./src/web/WebRoot').default 
  : App;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(AppRoot);
