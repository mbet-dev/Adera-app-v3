import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeArea, Card, TextInput, Button, useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PartnerSelectionModal from '../../components/PartnerSelectionModal';
import { useAuth } from '@adera/auth';
import * as Yup from 'yup';
import { createParcelRecord } from '../../services/parcelService';
import { usePartners } from '../../hooks/usePartners';

const { width } = Dimensions.get('window');

const PACKAGE_SIZES = [
  { id: 'document', label: 'Document', icon: 'file-document', basePrice: 50, weight: 0.5 },
  { id: 'small', label: 'Small (< 2kg)', icon: 'package-variant', basePrice: 100, weight: 1.5 },
  { id: 'medium', label: 'Medium (2-5kg)', icon: 'package', basePrice: 150, weight: 4 },
  { id: 'large', label: 'Large (5-10kg)', icon: 'package-variant-closed', basePrice: 250, weight: 8 },
];

const PACKAGE_TYPES = [
  { id: 'fragile', label: 'Fragile', icon: 'package-variant' },
  { id: 'electronics', label: 'Electronics', icon: 'laptop' },
  { id: 'clothing', label: 'Clothing', icon: 'tshirt-crew' },
  { id: 'food', label: 'Food', icon: 'food' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal' },
];

const PAYMENT_METHODS = [
  { id: 'wallet', label: 'Wallet', icon: 'wallet', available: true },
  { id: 'telebirr', label: 'Telebirr', icon: 'cellphone', available: true },
  { id: 'chapa', label: 'Chapa', icon: 'credit-card', available: true },
  { id: 'cod', label: 'Cash on Dropoff', icon: 'cash', available: true },
];

const STEP_FIELDS = {
  1: ['recipientName', 'recipientPhone'],
  2: ['packageSize', 'packageType'],
  3: ['dropoffPartner', 'pickupPartner'],
  4: ['paymentMethod', 'termsAccepted'],
};

const DEFAULT_COORDS = { latitude: 8.9806, longitude: 38.7578 };

const isValidEthiopianPhone = (value) => {
  if (!value) return false;
  const sanitized = value.replace(/[\s-]/g, '');
  return /^(?:\+251|0)?9\d{8}$/.test(sanitized);
};

const normalizeEthiopianPhone = (value) => {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.startsWith('251') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+251${digits.substring(1)}`;
  }
  if (digits.startsWith('9') && digits.length === 9) {
    return `+251${digits}`;
  }
  return value;
};

const haversineDistance = (start, end) => {
  if (!start || !end) return 0;
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(end.latitude - start.latitude);
  const dLon = toRad(end.longitude - start.longitude);
  const lat1 = toRad(start.latitude);
  const lat2 = toRad(end.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getPartnerCoordinates = (partner) => {
  if (!partner?.location) return null;
  const { latitude, longitude } = partner.location;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }
  return { latitude, longitude };
};

const partnerSchema = Yup.object({
  id: Yup.string().required(),
  ownerId: Yup.string().required(),
  location: Yup.object({
    latitude: Yup.number().required(),
    longitude: Yup.number().required(),
  }).required(),
  address: Yup.string().nullable(),
}).nullable();

const parcelValidationSchema = Yup.object({
  recipientName: Yup.string()
    .trim()
    .min(2, 'Recipient name is too short')
    .max(120, 'Recipient name is too long')
    .required('Recipient name is required'),
  recipientPhone: Yup.string()
    .required('Recipient phone is required')
    .test('is-ethiopian-phone', 'Enter a valid Ethiopian phone number', isValidEthiopianPhone),
  description: Yup.string().max(500).nullable(),
  packageSize: Yup.string()
    .oneOf(PACKAGE_SIZES.map((size) => size.id), 'Select a package size')
    .required('Package size is required'),
  packageType: Yup.string()
    .oneOf(PACKAGE_TYPES.map((type) => type.id), 'Select a package type')
    .required('Package type is required'),
  dropoffPartner: partnerSchema.required('Select a drop-off partner'),
  pickupPartner: partnerSchema.required('Select a pick-up partner'),
  paymentMethod: Yup.string()
    .oneOf(PAYMENT_METHODS.map((method) => method.id), 'Select a payment method')
    .required('Payment method is required'),
  termsAccepted: Yup.boolean().oneOf([true], 'Please accept the terms to continue'),
});

const CreateParcel = ({ navigation }) => {
  const theme = useTheme();
  
  // Form state
  const [step, setStep] = useState(1);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [packageSize, setPackageSize] = useState('');
  const [packageType, setPackageType] = useState('');
  const [description, setDescription] = useState('');
  const [dropoffPartner, setDropoffPartner] = useState(null);
  const [pickupPartner, setPickupPartner] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showDropoffModal, setShowDropoffModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [routeDistance, setRouteDistance] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { userLocation } = usePartners();

  const calculatePrice = useCallback(() => {
    if (!packageSize || !dropoffPartner || !pickupPartner) {
      setEstimatedPrice(0);
      setRouteDistance(0);
      return;
    }

    const dropoffCoords = getPartnerCoordinates(dropoffPartner);
    const pickupCoords = getPartnerCoordinates(pickupPartner);

    if (!dropoffCoords || !pickupCoords) {
      setEstimatedPrice(0);
      setRouteDistance(0);
      return;
    }

    const distance = haversineDistance(dropoffCoords, pickupCoords);
    const sizeData = PACKAGE_SIZES.find((size) => size.id === packageSize);
    const basePrice = sizeData?.basePrice || 0;
    const distancePrice = distance * 20;

    setRouteDistance(distance);
    setEstimatedPrice(basePrice + distancePrice);
  }, [packageSize, dropoffPartner, pickupPartner]);

  useEffect(() => {
    calculatePrice();
  }, [calculatePrice]);

  const buildFormValues = useCallback(() => ({
    recipientName,
    recipientPhone,
    description,
    packageSize,
    packageType,
    dropoffPartner,
    pickupPartner,
    paymentMethod,
    termsAccepted,
  }), [
    recipientName,
    recipientPhone,
    description,
    packageSize,
    packageType,
    dropoffPartner,
    pickupPartner,
    paymentMethod,
    termsAccepted,
  ]);

  const handleValidationErrors = (validationError, fields) => {
    const nextErrors = {};
    const relevantErrors = validationError.inner?.length ? validationError.inner : [validationError];

    relevantErrors.forEach((errorItem) => {
      if (!errorItem.path) return;
      const rootPath = errorItem.path.split('.')[0];
      if (!fields || fields.includes(rootPath)) {
        nextErrors[rootPath] = errorItem.message;
      }
    });

    setFormErrors((prev) => ({ ...prev, ...nextErrors }));
    return false;
  };

  const validateFields = useCallback(async (fields) => {
    if (!fields || fields.length === 0) return true;

    try {
      await parcelValidationSchema.pick(fields).validate(buildFormValues(), { abortEarly: false });
      setFormErrors((prev) => {
        const next = { ...prev };
        fields.forEach((field) => {
          delete next[field];
        });
        return next;
      });
      return true;
    } catch (validationError) {
      return handleValidationErrors(validationError, fields);
    }
  }, [buildFormValues]);

  const validateAll = useCallback(async () => {
    try {
      await parcelValidationSchema.validate(buildFormValues(), { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (validationError) {
      handleValidationErrors(validationError);
      return false;
    }
  }, [buildFormValues]);

  const resetForm = () => {
    setStep(1);
    setRecipientName('');
    setRecipientPhone('');
    setPackageSize('');
    setPackageType('');
    setDescription('');
    setDropoffPartner(null);
    setPickupPartner(null);
    setPaymentMethod('');
    setTermsAccepted(false);
    setEstimatedPrice(0);
    setRouteDistance(0);
    setFormErrors({});
  };

  const handleNext = async () => {
    const fieldsToValidate = STEP_FIELDS[step];
    const isValid = await validateFields(fieldsToValidate);
    if (!isValid) return;

    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in before creating a parcel.');
      return;
    }

    const isValid = await validateAll();
    if (!isValid) return;

    const dropoffCoords = getPartnerCoordinates(dropoffPartner);
    const pickupCoords = getPartnerCoordinates(pickupPartner);

    if (!dropoffCoords || !pickupCoords) {
      Alert.alert('Partner location missing', 'Selected partners are missing location data. Please re-select them.');
      return;
    }

    const sanitizedPhone = normalizeEthiopianPhone(recipientPhone);
    const sizeMeta = PACKAGE_SIZES.find((size) => size.id === packageSize);
    const estimatedWeight = sizeMeta?.weight ?? null;
    const priceValue = Number((estimatedPrice || 0).toFixed(2));
    const distanceValue = Number((routeDistance || 0).toFixed(2));
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const actorRole = user?.user_metadata?.role || 'customer';

    const parcelPayload = {
      sender_id: user.id,
      recipient_name: recipientName.trim(),
      recipient_phone: sanitizedPhone,
      description: description.trim() || null,
      dropoff_partner_id: dropoffPartner.ownerId,
      pickup_partner_id: pickupPartner.ownerId,
      dropoff_shop_id: dropoffPartner.id,
      pickup_shop_id: pickupPartner.id,
      pickup_location: dropoffCoords,
      pickup_address: dropoffPartner.address || '',
      delivery_location: pickupCoords,
      delivery_address: pickupPartner.address || '',
      package_size: packageSize,
      package_type: packageType,
      weight: estimatedWeight,
      delivery_fee: priceValue,
      insurance_fee: 0,
      total_amount: priceValue,
      payment_method: paymentMethod,
      payment_status: 'pending',
      status: 0,
      fragile: packageType === 'fragile',
      urgent: false,
      estimated_price: priceValue,
      distance_km: distanceValue,
      terms_accepted: true,
      expires_at: expiryDate.toISOString(),
      current_location: dropoffCoords,
    };

    setSubmitting(true);
    try {
      const createdParcel = await createParcelRecord({
        parcel: parcelPayload,
        initialEvent: {
          actorId: user.id,
          actorRole,
          status: 0,
          location: dropoffCoords,
          notes: 'Parcel created by sender',
        },
      });

      Alert.alert(
        'Parcel Created!',
        `Tracking ID: ${createdParcel.tracking_id}`,
        [
          {
            text: 'Track Parcel',
            onPress: () => navigation?.navigate?.('track', { trackingId: createdParcel.tracking_id }),
          },
          { text: 'Close', style: 'cancel' },
        ]
      );

      resetForm();
    } catch (error) {
      console.error('createParcel error', error);
      Alert.alert('Parcel creation failed', error.message || 'Unable to create parcel right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((s) => (
        <View key={s} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor: s <= step ? theme.colors.primary : theme.colors.surfaceVariant,
              },
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                { color: s <= step ? '#FFF' : theme.colors.text.secondary },
              ]}
            >
              {s}
            </Text>
          </View>
          {s < 4 && (
            <View
              style={[
                styles.stepLine,
                {
                  backgroundColor: s < step ? theme.colors.primary : theme.colors.surfaceVariant,
                },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Recipient Details
      </Text>
      <TextInput
        label="Recipient Name"
        value={recipientName}
        onChangeText={setRecipientName}
        placeholder="Enter recipient's full name"
        autoCapitalize="words"
        leftIcon="account"
        webType="text"
        error={formErrors.recipientName}
      />
      <TextInput
        label="Phone Number"
        value={recipientPhone}
        onChangeText={setRecipientPhone}
        placeholder="+251 9XX XXX XXX"
        keyboardType="phone-pad"
        leftIcon="phone"
        webType="tel"
        error={formErrors.recipientPhone}
      />
      <TextInput
        label="Description (Optional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Brief description of parcel contents"
        multiline
        numberOfLines={3}
        leftIcon="text"
        webType="text"
        error={formErrors.description}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Package Details
      </Text>
      
      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
        Select Package Size
      </Text>
      <View style={styles.optionsGrid}>
        {PACKAGE_SIZES.map((size) => (
          <TouchableOpacity
            key={size.id}
            style={[
              styles.optionCard,
              {
                backgroundColor: packageSize === size.id
                  ? theme.colors.primaryContainer
                  : theme.colors.surface,
                borderColor: packageSize === size.id
                  ? theme.colors.primary
                  : theme.colors.outline,
              },
            ]}
            onPress={() => setPackageSize(size.id)}
          >
            <MaterialCommunityIcons
              name={size.icon}
              size={32}
              color={packageSize === size.id ? theme.colors.primary : theme.colors.text.secondary}
            />
            <Text
              style={[
                styles.optionLabel,
                {
                  color: packageSize === size.id
                    ? theme.colors.primary
                    : theme.colors.text.primary,
                },
              ]}
            >
              {size.label}
            </Text>
            <Text style={[styles.optionPrice, { color: theme.colors.text.secondary }]}>
              From {size.basePrice} ETB
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {formErrors.packageSize && (
        <Text style={[styles.fieldError, { color: theme.colors.error }]}>
          {formErrors.packageSize}
        </Text>
      )}
      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary, marginTop: 24 }]}>
        Package Type
      </Text>
      <View style={styles.typeList}>
        {PACKAGE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeItem,
              {
                backgroundColor: packageType === type.id
                  ? theme.colors.primaryContainer
                  : theme.colors.surface,
                borderColor: packageType === type.id
                  ? theme.colors.primary
                  : theme.colors.outline,
              },
            ]}
            onPress={() => setPackageType(type.id)}
          >
            <MaterialCommunityIcons
              name={type.icon}
              size={24}
              color={packageType === type.id ? theme.colors.primary : theme.colors.text.secondary}
            />
            <Text
              style={[
                styles.typeLabel,
                {
                  color: packageType === type.id
                    ? theme.colors.primary
                    : theme.colors.text.primary,
                },
              ]}
            >
              {type.label}
            </Text>
            {packageType === type.id && (
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={theme.colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
      {formErrors.packageType && (
        <Text style={[styles.fieldError, { color: theme.colors.error }]}>
          {formErrors.packageType}
        </Text>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Select Locations
      </Text>
      
      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
        Drop-off Partner
      </Text>
      <Card style={styles.locationCard}>
        <TouchableOpacity
          style={styles.locationSelector}
          onPress={() => setShowDropoffModal(true)}
        >
          {dropoffPartner ? (
            <View style={styles.selectedLocation}>
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color={theme.colors.primary}
              />
              <View style={styles.locationInfo}>
                <Text style={[styles.locationName, { color: theme.colors.text.primary }]}>
                  {dropoffPartner.name}
                </Text>
                <Text style={[styles.locationDistance, { color: theme.colors.text.secondary }]}>
                  {typeof dropoffPartner.distance === 'number'
                    ? `${dropoffPartner.distance.toFixed(1)} km away`
                    : 'Distance unavailable'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.locationPlaceholder}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={24}
                color={theme.colors.text.secondary}
              />
              <Text style={[styles.locationPlaceholderText, { color: theme.colors.text.secondary }]}>
                Select drop-off location
              </Text>
            </View>
          )}
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>
      </Card>
      {formErrors.dropoffPartner && (
        <Text style={[styles.fieldError, { color: theme.colors.error }]}>
          {formErrors.dropoffPartner}
        </Text>
      )}
      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary, marginTop: 16 }]}>
        Pick-up Partner
      </Text>
      <Card style={styles.locationCard}>
        <TouchableOpacity
          style={styles.locationSelector}
          onPress={() => setShowPickupModal(true)}
        >
          {pickupPartner ? (
            <View style={styles.selectedLocation}>
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color={theme.colors.secondary}
              />
              <View style={styles.locationInfo}>
                <Text style={[styles.locationName, { color: theme.colors.text.primary }]}>
                  {pickupPartner.name}
                </Text>
                <Text style={[styles.locationDistance, { color: theme.colors.text.secondary }]}>
                  {typeof pickupPartner.distance === 'number'
                    ? `${pickupPartner.distance.toFixed(1)} km away`
                    : 'Distance unavailable'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.locationPlaceholder}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={24}
                color={theme.colors.text.secondary}
              />
              <Text style={[styles.locationPlaceholderText, { color: theme.colors.text.secondary }]}>
                Select pick-up location
              </Text>
            </View>
          )}
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>
      </Card>
      {formErrors.pickupPartner && (
        <Text style={[styles.fieldError, { color: theme.colors.error }]}>
          {formErrors.pickupPartner}
        </Text>
      )}

      {estimatedPrice > 0 && (
        <Card style={[styles.priceCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <View style={styles.priceHeader}>
            <Text style={[styles.priceLabel, { color: theme.colors.primary }]}>
              Estimated Price
            </Text>
            <Text style={[styles.priceValue, { color: theme.colors.primary }]}>
              {estimatedPrice.toFixed(2)} ETB
            </Text>
          </View>
          <Text style={[styles.priceNote, { color: theme.colors.text.secondary }]}>
            Route distance: {routeDistance > 0 ? `${routeDistance.toFixed(2)} km` : 'N/A'}
          </Text>
          <Text style={[styles.priceNote, { color: theme.colors.text.secondary }]}>
            Final price may vary based on actual weight and dimensions
          </Text>
        </Card>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Payment & Confirmation
      </Text>
      
      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
        Payment Method
      </Text>
      <View style={styles.paymentMethods}>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethod,
              {
                backgroundColor: paymentMethod === method.id
                  ? theme.colors.primaryContainer
                  : theme.colors.surface,
                borderColor: paymentMethod === method.id
                  ? theme.colors.primary
                  : theme.colors.outline,
              },
            ]}
            onPress={() => setPaymentMethod(method.id)}
            disabled={!method.available}
          >
            <MaterialCommunityIcons
              name={method.icon}
              size={24}
              color={paymentMethod === method.id ? theme.colors.primary : theme.colors.text.secondary}
            />
            <Text
              style={[
                styles.paymentLabel,
                {
                  color: paymentMethod === method.id
                    ? theme.colors.primary
                    : theme.colors.text.primary,
                },
              ]}
            >
              {method.label}
            </Text>
            {paymentMethod === method.id && (
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={theme.colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
      {formErrors.paymentMethod && (
        <Text style={[styles.fieldError, { color: theme.colors.error }]}>
          {formErrors.paymentMethod}
        </Text>
      )}

      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Text style={[styles.summaryTitle, { color: theme.colors.text.primary }]}>
          Order Summary
        </Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
            Recipient
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
            {recipientName}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
            Package Size
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
            {PACKAGE_SIZES.find(s => s.id === packageSize)?.label}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
            Drop-off
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
            {dropoffPartner?.name}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
            Pick-up
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
            {pickupPartner?.name}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
            Route Distance
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
            {routeDistance > 0 ? `${routeDistance.toFixed(2)} km` : 'N/A'}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryTotal]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.primary, fontWeight: '700' }]}>
            Total
          </Text>
          <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
            {estimatedPrice.toFixed(2)} ETB
          </Text>
        </View>
      </Card>

      {/* Terms and Conditions */}
      <TouchableOpacity
        style={styles.termsCheckbox}
        onPress={() => setTermsAccepted(!termsAccepted)}
      >
        <MaterialCommunityIcons
          name={termsAccepted ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
          color={termsAccepted ? theme.colors.primary : theme.colors.text.secondary}
        />
        <Text style={[styles.termsText, { color: theme.colors.text.secondary }]}>
          I accept the{' '}
          <Text
            style={{ color: theme.colors.primary, fontWeight: '600' }}
            onPress={() => setShowTermsModal(true)}
          >
            Terms & Conditions
          </Text>
        </Text>
      </TouchableOpacity>
      {formErrors.termsAccepted && (
        <Text style={[styles.fieldError, { color: theme.colors.error }]}>
          {formErrors.termsAccepted}
        </Text>
      )}
    </View>
  );

  return (
    <SafeArea edges={['top', 'bottom']} withBottomNav={true}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={step > 1 ? handleBack : () => navigation?.goBack?.()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Create Parcel
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {renderStepIndicator()}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
          <Button
            title={step < 4 ? 'Next' : 'Create Parcel'}
            onPress={handleNext}
            size="lg"
            style={styles.nextButton}
            loading={submitting}
            disabled={submitting}
          />
        </View>

        {/* Partner Selection Modals */}
        <PartnerSelectionModal
          visible={showDropoffModal}
          onClose={() => setShowDropoffModal(false)}
          onSelect={(partner) => {
            setDropoffPartner(partner);
            setShowDropoffModal(false);
          }}
          selectedPartner={dropoffPartner}
          title="Select Drop-off Partner"
          filterType="dropoff"
          userLocation={userLocation}
        />
        
        <PartnerSelectionModal
          visible={showPickupModal}
          onClose={() => setShowPickupModal(false)}
          onSelect={(partner) => {
            setPickupPartner(partner);
            setShowPickupModal(false);
          }}
          selectedPartner={pickupPartner}
          title="Select Pick-up Partner"
          filterType="pickup"
          userLocation={userLocation}
        />

        {/* Terms Modal */}
        <Modal
          visible={showTermsModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowTermsModal(false)}
        >
          <SafeArea edges={['top']}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                  Terms & Conditions
                </Text>
                <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={theme.colors.text.primary}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                <Text style={[styles.termsContent, { color: theme.colors.text.secondary }]}>
                  {`1. Parcel creation requires payment before processing.
                  
2. Prohibited items include weapons, drugs, hazardous materials, and illegal substances.

3. Maximum weight is 10kg. Oversized parcels require special handling.

4. Delivery times are estimated and not guaranteed.

5. Adera is not liable for damage to improperly packaged items.

6. COD requires recipient confirmation within 24 hours.

7. Tracking codes must be kept secure until delivery completion.

8. Disputes must be filed within 7 days of delivery.

9. Refunds are processed within 5-7 business days for canceled parcels.

10. By accepting these terms, you agree to Adera's privacy policy and service agreement.`}
                </Text>
              </ScrollView>
              <View style={[styles.modalFooter, { backgroundColor: theme.colors.surface }]}>
                <Button
                  title="Accept & Continue"
                  onPress={() => {
                    setTermsAccepted(true);
                    setShowTermsModal(false);
                  }}
                  size="lg"
                />
              </View>
            </View>
          </SafeArea>
        </Modal>
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  stepIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  stepItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  stepContent: {
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionPrice: {
    fontSize: 12,
  },
  typeList: {
    gap: 12,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  typeLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  locationCard: {
    padding: 0,
    overflow: 'hidden',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationDistance: {
    fontSize: 14,
  },
  locationPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locationPlaceholderText: {
    fontSize: 16,
  },
  priceCard: {
    padding: 16,
    marginTop: 16,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  priceNote: {
    fontSize: 12,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  paymentLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  summaryCard: {
    padding: 16,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  fieldError: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  nextButton: {
    width: '100%',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  termsContent: {
    fontSize: 14,
    lineHeight: 24,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});

export default CreateParcel;
