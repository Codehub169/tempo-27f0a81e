import React from 'react';
import ReactDOM from 'react-dom/client'; // Updated for React 18
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';
import theme from './theme';
// import reportWebVitals from './reportWebVitals'; // Optional: for performance monitoring

// Tailwind CSS base styles are typically imported in a global CSS file (e.g., index.css or App.css)
// and processed by PostCSS. Ensure your Tailwind setup includes these directives:
// @tailwind base;
// @tailwind components;
// @tailwind utilities;
// For this project, this is handled by the build process and postcss.config.js

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
