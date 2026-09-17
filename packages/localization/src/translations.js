import { LanguageCode } from './types';

/**
 * Translation strings for the Adera Hybrid App.
 * English is the default; Amharic translations cover core flows.
 */

const translations = {
  [LanguageCode.ENGLISH]: {
    // General
    'app.name': 'Adera',
    'app.loading': 'Loading...',
    'app.error': 'Something went wrong',
    'app.retry': 'Retry',
    'app.cancel': 'Cancel',
    'app.save': 'Save',
    'app.confirm': 'Confirm',
    'app.back': 'Back',
    'app.next': 'Next',
    'app.done': 'Done',
    'app.close': 'Close',
    'app.search': 'Search',

    // Auth
    'auth.login': 'Sign In',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Sign Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.resetPassword': 'Reset Password',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.guestMode': 'Continue as Guest',
    'auth.welcomeBack': 'Welcome Back',
    'auth.createAccount': 'Create Account',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.send': 'Send',
    'nav.track': 'Track',
    'nav.history': 'History',
    'nav.profile': 'Profile',
    'nav.cart': 'Cart',
    'nav.orders': 'Orders',
    'nav.browse': 'Browse',

    // Parcel
    'parcel.create': 'Create Parcel',
    'parcel.track': 'Track Parcel',
    'parcel.trackingId': 'Tracking ID',
    'parcel.recipient': 'Recipient',
    'parcel.phone': 'Phone Number',
    'parcel.description': 'Description',
    'parcel.packageSize': 'Package Size',
    'parcel.packageType': 'Package Type',
    'parcel.dropoff': 'Drop-off Location',
    'parcel.pickup': 'Pick-up Location',
    'parcel.paymentMethod': 'Payment Method',
    'parcel.total': 'Total',
    'parcel.status.created': 'Created',
    'parcel.status.dropoff': 'At Drop-off',
    'parcel.status.inTransit': 'In Transit',
    'parcel.status.atHub': 'At Hub',
    'parcel.status.dispatched': 'Dispatched',
    'parcel.status.atPickup': 'At Pickup Point',
    'parcel.status.delivered': 'Delivered',

    // Shop
    'shop.name': 'Adera Shop',
    'shop.products': 'Products',
    'shop.addToCart': 'Add to Cart',
    'shop.checkout': 'Checkout',
    'shop.orderHistory': 'Order History',
    'shop.categories': 'Categories',

    // Common
    'common.etb': 'ETB',
    'common.km': 'km',
    'common.loading': 'Loading...',
    'common.empty': 'Nothing here yet',
    'common.networkError': 'Connection error. Please check your internet.',
    'common.saved': 'Saved successfully',
  },

  [LanguageCode.AMHARIC]: {
    // General
    'app.name': 'አዴራ',
    'app.loading': 'በመጫን ላይ...',
    'app.error': 'ችግር ተፈጥሯል',
    'app.retry': 'እንደገና ሞክር',
    'app.cancel': 'ሰርዝ',
    'app.save': 'አስቀምጥ',
    'app.confirm': 'ያረጋግጡ',
    'app.back': 'ተመለስ',
    'app.next': 'ቀጥል',
    'app.done': 'ተከናውኗል',
    'app.close': 'ዝጋ',
    'app.search': 'ፈልግ',

    // Auth
    'auth.login': 'ግባ',
    'auth.signup': 'ተመዝገብ',
    'auth.logout': 'ውጣ',
    'auth.email': 'ኢሜይል',
    'auth.password': 'የይለፍ ቃል',
    'auth.forgotPassword': 'የይለፍ ቃል ረሳችሁ?',
    'auth.resetPassword': 'የይለፍ ቃል አደራጅ',
    'auth.noAccount': 'መለያ የላችሁም?',
    'auth.hasAccount': 'መለያ አለዎ?',
    'auth.guestMode': 'እንግዳ ሆነህ ቀጥል',
    'auth.welcomeBack': 'እንኳን ደህና መጡ',
    'auth.createAccount': 'መለያ ፍጠር',

    // Navigation
    'nav.dashboard': 'ዳሽቦርድ',
    'nav.send': 'ልካ',
    'nav.track': 'ተከታታይ',
    'nav.history': 'ታሪክ',
    'nav.profile': 'መገለጫ',
    'nav.cart': 'ጋዝ',
    'nav.orders': 'ትዕዛዞች',
    'nav.browse': 'ቃኝ',

    // Parcel
    'parcel.create': 'ጭን ፍጠር',
    'parcel.track': 'ጭን ተከታተል',
    'parcel.trackingId': 'የተከታተይ መለያ',
    'parcel.recipient': 'ተቀባይ',
    'parcel.phone': 'ስልክ ቁጥር',
    'parcel.description': 'ግለ መግለጫ',
    'parcel.packageSize': 'የጭኑ መጠን',
    'parcel.packageType': 'የጭኑ ዓይነት',
    'parcel.dropoff': 'የማስተኛ ቦታ',
    'parcel.pickup': 'የማጓጓዝ ቦታ',
    'parcel.paymentMethod': 'የክፍያ ዘዴ',
    'parcel.total': 'ጠቅላላ',
    'parcel.status.created': 'ተፈጥሯል',
    'parcel.status.dropoff': 'በማስተኛ ቦታ ላይ',
    'parcel.status.inTransit': 'በመንገድ ላይ',
    'parcel.status.atHub': 'በሃብ ላይ',
    'parcel.status.dispatched': 'ተልኳል',
    'parcel.status.atPickup': 'በማጓጓዝ ቦታ ላይ',
    'parcel.status.delivered': 'ደርሷል',

    // Shop
    'shop.name': 'አዴራ ሱቅ',
    'shop.products': 'ምርቶች',
    'shop.addToCart': 'ወደ ጋዝ አክል',
    'shop.checkout': 'ክፍል',
    'shop.orderHistory': 'የትዕዛዝ ታሪክ',
    'shop.categories': 'ምድቦች',

    // Common
    'common.etb': 'ብር',
    'common.km': 'ኪሜ',
    'common.loading': 'በመጫን ላይ...',
    'common.empty': 'እዚህ ምንም የለም',
    'common.networkError': 'የመስመር ችግር። እባክዎ ኢንተርኔትዎን ይፈትሹ።',
    'common.saved': 'በተሳካ ሁኔታ ተቀምጧል',
  },
};

export default translations;
