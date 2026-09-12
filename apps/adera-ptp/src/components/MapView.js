import { View } from 'react-native';
// This is the web fallback for MapView. It renders nothing.
const MapView = (props) => <View {...props} />;
const Marker = (props) => <View {...props} />;
const Callout = (props) => <View {...props} />;

export default MapView;
export { Marker, Callout };
