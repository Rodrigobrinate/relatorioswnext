"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Painel de Transceivers', href: '/' },
  { name: 'Top 20 Erros', href: '/dashboards/erros' },
  { name: 'grafico de erros', href: '/relatorios/erros'},
  { name: 'Relatório de Potência', href: '/relatorios/potencia' },
  // Adicione aqui novos links para futuras páginas
  // { name: 'Taxa de Erros', href: '/dashboards/error-rate' },
  // { name: 'Relatório de Potência', href: '/reports/power' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Meu Painel NOC</h2>
      </div>
      <nav>
        <ul>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.name} className="mb-2">
                <Link 
                  href={link.href}
                  className={`block p-2 rounded hover:bg-gray-700 transition-colors ${isActive ? 'bg-blue-600' : ''}`}
                >
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}