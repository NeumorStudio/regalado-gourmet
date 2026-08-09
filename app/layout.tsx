/**
 * Pasarela. El <html> y el <body> los pone `app/[lang]/layout.tsx`, que es el
 * único que sabe el idioma. Si este layout pintara <html> saldrían dos
 * anidados y el documento sería inválido.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return children;
}
