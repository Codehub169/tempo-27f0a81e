import { extendTheme } from '@chakra-ui/react';

// Theme configuration based on the provided design system
const colors = {
  primary: '#007BFF',       // Professional Blue
  secondary: '#6C757D',     // Neutral Grey
  accent: '#28A745',        // Vibrant Green
  'neutral-white': '#FFFFFF',
  'neutral-light-gray': '#F8F9FA',
  'neutral-medium-gray': '#E9ECEF',
  'neutral-dark-gray': '#343A40',
  'text-primary': '#212529',
  'text-secondary': '#6C757D',
  'border-color': '#DEE2E6',
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  // Chakra specific color mappings (can be more detailed)
  brand: {
    50: '#e6f2ff',  // Lighter shades of primary
    100: '#b3d7ff',
    200: '#80bcff',
    300: '#4da0ff',
    400: '#1a85ff',
    500: '#007BFF', // Primary color
    600: '#0062cc',
    700: '#004a99',
    800: '#003166',
    900: '#001933',  // Darker shades of primary
  },
  // You can add more specific color shades for Chakra components if needed
  // For example, for gray shades used by Chakra components:
  gray: {
    50: '#F8F9FA',  // neutral-light-gray
    100: '#E9ECEF', // neutral-medium-gray
    200: '#DEE2E6', // border-color
    // ... other shades
    700: '#4A5568', // A common Chakra gray for text/borders
    800: '#343A40', // neutral-dark-gray
    900: '#212529', // text-primary
  }
};

const fonts = {
  heading: `'Poppins', sans-serif`,
  body: `'Inter', sans-serif`,
};

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  styles: {
    global: (props) => ({
      body: {
        fontFamily: 'body',
        color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'text-primary',
        bg: props.colorMode === 'dark' ? 'gray.800' : 'neutral-light-gray',
        lineHeight: 'base',
      },
      '*::placeholder': {
        color: props.colorMode === 'dark' ? 'whiteAlpha.400' : 'gray.400',
      },
      '*, *::before, &::after': {
        borderColor: props.colorMode === 'dark' ? 'whiteAlpha.300' : 'border-color',
      },
      // Specific overrides for components if needed
    }),
  },
  components: {
    // Example: Customizing Button component default props
    Button: {
      baseStyle: {
        fontWeight: '600', // Poppins is generally bolder
        borderRadius: '8px', // Match design system
      },
      variants: {
        solid: (props) => ({
          bg: props.colorScheme === 'brand' ? 'brand.500' : undefined,
          color: props.colorScheme === 'brand' ? 'white' : undefined,
          _hover: {
            bg: props.colorScheme === 'brand' ? 'brand.600' : undefined,
          }
        }),
      },
      defaultProps: {
        colorScheme: 'brand', // Make 'brand' (our primary) the default for buttons
      },
    },
    // Add other component customizations here
    Input: {
      baseStyle: {
        field: {
            borderColor: 'border-color',
        }
      },
      defaultProps: {
        focusBorderColor: 'brand.500',
      }
    },
    Select: {
        defaultProps: {
            focusBorderColor: 'brand.500',
        }
    },
    Textarea: {
        defaultProps: {
            focusBorderColor: 'brand.500',
        }
    }
  }
});

export default theme;
