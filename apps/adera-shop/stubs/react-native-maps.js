// Web stub for react-native-maps
// Prevents native-only module import errors on web platform
const React = require('react');
const { View } = require('react-native');

const MapView = (props) => React.createElement(View, { ...props, style: [props.style, { minHeight: 200 }] });
const Marker = () => null;
const Callout = () => null;
const Polygon = () => null;
const Polyline = () => null;
const Circle = () => null;
const PROVIDER_GOOGLE = 'google';
const MAP_TYPES = { STANDARD: 'standard', SATELLITE: 'satellite', HYBRID: 'hybrid', TERRAIN: 'terrain' };

module.exports = {
  __esModule: true,
  default: MapView,
  MapView,
  Marker,
  Callout,
  Polygon,
  Polyline,
  Circle,
  PROVIDER_GOOGLE,
  MAP_TYPES,
};
