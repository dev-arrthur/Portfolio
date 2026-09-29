'use client';
export default function Error({ reset }: { reset: () => void }) { return <main className="simple-page"><h1>Não foi possível abrir esta página.</h1><p>Tente novamente em instantes.</p><button onClick={reset}>Tentar novamente</button> <a href="/">Voltar ao início</a></main>; }
