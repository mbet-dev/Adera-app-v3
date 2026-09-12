import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from './Button';
import { useTheme } from './ThemeProvider';
import FlagEthiopia from './components/FlagEthiopia';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    title: 'Welcome to Adera',
    subtitle: 'Ethiopia\'s Premier Digital Platform',
    description: "Your all-in-one ecosystem for logistics and e-commerce in Addis Ababa.",
    image: '🏺',
  },
  {
    title: 'Connect Communities',
    subtitle: 'Bridging Digital & Traditional',
    description: 'Empowering local businesses and communities through technology and trust.',
    image: '🤝',
  },
  {
    title: 'Ethiopian Excellence',
    subtitle: 'Built for Local Needs',
    description: 'Designed specifically for Ethiopian culture, payments, and infrastructure.',
    image: '🇪🇹',
  },
  {
    title: 'Let\'s Begin',
    subtitle: 'Ready to Explore?',
    description: 'Choose your app experience and start your journey with Adera.',
    image: '🚀',
  },
];

const OnboardingScreen = ({ onComplete }) => {
  const theme = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const pagerRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleMomentumEnd = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextIndex = currentSlide + 1;
      pagerRef.current?.scrollTo({ x: width * nextIndex, animated: true });
      setCurrentSlide(nextIndex);
      return;
    }
    onComplete();
  };

  const handleSkip = () => onComplete();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.primary }]} edges={['top', 'bottom', 'left', 'right']}> 
      <View style={styles.wrapper}>
        <Animated.ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumEnd}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {slides.map((slide, index) => (
            <View key={slide.title} style={styles.slide}>
              <View
                style={[
                  styles.imageContainer,
                  { backgroundColor: theme.colors.onPrimary + '1F' },
                ]}
              >
                {typeof slide.image === 'string' ? (
                  slide.image === '🇪🇹' && Platform.OS === 'web' ? (
                    <FlagEthiopia width={80} height={56} />
                  ) : (
                    <Text style={[styles.emoji, { color: theme.colors.onPrimary }]}>
                      {slide.image}
                    </Text>
                  )
                ) : (
                  <Image source={slide.image} style={styles.flagImage} />
                )}
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: theme.colors.onPrimary }]}>
                  {slide.title}
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.onPrimary }]}>
                  {slide.subtitle}
                </Text>
                <Text style={[styles.description, { color: theme.colors.onPrimary }]}>
                  {slide.description}
                </Text>
              </View>
            </View>
          ))}
        </Animated.ScrollView>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor:
                      index === currentSlide
                        ? theme.colors.onPrimary
                        : theme.colors.onPrimary + '33',
                    transform: [
                      {
                        scale: index === currentSlide ? 1.2 : 1,
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>

          {currentSlide < slides.length - 1 ? (
            <View style={styles.buttonRow}>
              <Button
                title="Skip"
                variant="ghost"
                onPress={handleSkip}
                style={styles.button}
                textStyle={{ color: theme.colors.onPrimary }}
              />
              <Button
                title="Next"
                variant="outline"
                onPress={handleNext}
                style={[styles.button, { borderColor: theme.colors.onPrimary }]}
                textStyle={{ color: theme.colors.onPrimary }}
              />
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <Button
                title="Choose Your App"
                variant="outline"
                onPress={handleNext}
                style={[styles.button, { borderColor: theme.colors.onPrimary }]}
                textStyle={{ color: theme.colors.onPrimary }}
              />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 0,
  },
  slide: {
    width,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
  },
  flagImage: {
    width: 60,
    height: 60,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default OnboardingScreen;
