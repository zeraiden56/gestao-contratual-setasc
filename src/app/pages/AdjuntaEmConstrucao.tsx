// src/app/pages/AdjuntaEmConstrucao.tsx
import { useParams } from "react-router-dom";

export const AdjuntaEmConstrucao = () => {
  const { sigla } = useParams<{ sigla: string }>();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">
        {sigla?.toUpperCase()} - página
      </h1>
      <p className="text-lg text-gray-600">
        Esta página está em construção.
      </p>
    </div>
  );
};
