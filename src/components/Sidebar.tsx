"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react'; // Importar useState

const navLinks = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Painel de Transceivers', href: '/' },
  { name: 'Top 20 Erros', href: '/dashboards/erros' },
  { name: 'grafico de erros', href: '/relatorios/erros'},
  { name: 'Relatório de Potência', href: '/relatorios/potencia' },
];

export default function Sidebar() {
  const pathname = usePathname();
  // 1. Criar o estado para controlar a visibilidade da sidebar
  const [isOpen, setIsOpen] = useState(true); 

  // Função para alternar o estado de visibilidade
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    // Um contêiner que permite o posicionamento absoluto do botão de toggle
    <>
      {/* 2. Adicionar o botão para alternar a visibilidade */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 left-4 p-2 rounded-full bg-blue-600 text-white z-50 transition-transform ${
          isOpen ? 'translate-x-64' : 'translate-x-0' // Ajusta a posição do botão
        }`}
        aria-label={isOpen ? 'Esconder Sidebar' : 'Mostrar Sidebar'}
      >
        {/* Usar um ícone simples para indicar a ação. (Pode ser substituído por um ícone como Heroicons) */}
        {isOpen ? '◀' : '▶'} 
      </button>

      {/* 3. Aplicar estilos condicionais com base no estado 'isOpen' */}
      <aside 
        className={`
          fixed top-0 left-0 h-full bg-gray-800 text-white p-4 flex flex-col z-40 transition-transform duration-300 ease-in-out 
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0 overflow-hidden'} 
        `}
      >
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
                    // Ocultar texto do link se a sidebar estiver completamente fechada, embora o overflow hidden do aside já ajude.
                    tabIndex={isOpen ? 0 : -1} 
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}