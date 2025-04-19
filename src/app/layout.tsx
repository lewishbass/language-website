import { Inter } from 'next/font/google';
import './globals.css';
import { ConversationProvider } from './contexts/ConversationContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Language Teacher Website',
  description: 'A website for language teaching and conversation practice',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConversationProvider>
          {children}
        </ConversationProvider>
      </body>
    </html>
  );
}
