import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Centras ScramBan — Управление проектами | Centras Insurance',
  description: 'Система управления проектами, Kanban-досками и командными спринтами для страховой компании Centras Insurance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
