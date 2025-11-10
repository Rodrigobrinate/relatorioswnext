import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard Principal</h1>
      <p className="mb-8 text-lg text-gray-600">Selecione uma das opções abaixo para começar.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card para o Painel de Transceivers */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 transition-all">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Painel de Transceivers</h2>
          <p className="text-gray-700 mb-4">
            Visualize o estado atual e os detalhes de todos os transceivers da rede em tempo real.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
          >
            Acessar Painel
            <svg className="w-3.5 h-3.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </Link>
        </div>

        {/* Adicione outros cards para novas telas aqui */}

      </div>
    </main>
  );
}