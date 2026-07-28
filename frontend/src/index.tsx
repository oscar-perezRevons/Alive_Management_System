import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import systemLogo from './assets/logo.png';

// Dynamic favicon update using system logo
const updateFavicon = (logoUrl: string) => {
  if (typeof document === 'undefined') return;
  const head = document.getElementsByTagName('head')[0];
  let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    head.appendChild(link);
  }
  link.type = 'image/png';
  link.href = logoUrl;

  let appleTouchLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
  if (!appleTouchLink) {
    appleTouchLink = document.createElement('link');
    appleTouchLink.rel = 'apple-touch-icon';
    head.appendChild(appleTouchLink);
  }
  appleTouchLink.href = logoUrl;
};

updateFavicon(systemLogo);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
