import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * La web anterior sirve /es/, /es/products/… con barra final, y esas URLs
   * están indexadas y enlazadas. Sin esto Next redirige a la versión sin barra
   * y se cambian todas las direcciones del sitio de golpe.
   */
  trailingSlash: true,

  images: {
    // Sin tocar imageSizes/deviceSizes: recortarlos hace que Next pida anchos
    // que ya no existen y el optimizador responde 400 (imágenes rotas).
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
