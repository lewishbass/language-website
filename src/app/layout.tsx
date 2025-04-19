import { Inter } from 'next/font/google';
import './globals.css';
import { ConversationProvider } from './contexts/ConversationContext';
import { MathJaxContext } from 'better-react-mathjax';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Language Teacher Website',
  description: 'A website for language teaching and conversation practice',
};

// MathJax configuration
const mathJaxConfig = {
  tex: {
    inlineMath: [['$', '$'], ['(', ')']],
    displayMath: [['$$', '$$'], ['[', ']']],
    processEscapes: true,
  },
  options: {
    enableMenu: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MathJaxContext config={mathJaxConfig}>
          <ConversationProvider>
            {children}
          </ConversationProvider>
        </MathJaxContext>
      </body>
    </html>
  );
}
