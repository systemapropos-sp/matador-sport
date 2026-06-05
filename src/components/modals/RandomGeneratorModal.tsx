import React, { useState } from "react";
import { Dices, Shuffle } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import { useModal } from "./ModalContext";
import { regularLotteries } from "@/data/lotteries";
import type { PlayType } from "@/types";

const playTypes: { key: PlayType; label: string; digits: number }[] = [
  { key: "directo", label: "Directo", digits: 2 },
  { key: "pale", label: "Pale", digits: 4 },
  { key: "tripleta", label: "Tripleta", digits: 6 },
  { key: "cash3", label: "Cash 3", digits: 3 },
  { key: "play4", label: "Play 4", digits: 4 },
  { key: "pick5", label: "Pick 5", digits: 5 },
];

function generateRandom(digits: number): string {
  let result = "";
  for (let i = 0; i < digits; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

export default function RandomGeneratorModal() {
  const { closeModal } = useModal();
  const [selectedLottery, setSelectedLottery] = useState(regularLotteries[0]?.id || "");
  const [selectedType, setSelectedType] = useState<PlayType>("directo");
  const [amount, setAmount] = useState(10);
  const [quantity, setQuantity] = useState(1);
  const [generated, setGenerated] = useState<string[]>([]);

  const typeDef = playTypes.find((t) => t.key === selectedType);

  const handleGenerate = () => {
    const results: string[] = [];
    for (let i = 0; i < quantity; i++) {
      results.push(generateRandom(typeDef?.digits || 2));
    }
    setGenerated(results);
  };

  return (
    <ModalWrapper title="Generador Aleatorio" onClose={closeModal} width="450px">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loteria</label>
          <select
            value={selectedLottery}
            onChange={(e) => setSelectedLottery(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {regularLotteries.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de jugada</label>
          <div className="grid grid-cols-3 gap-2">
            {playTypes.map((pt) => (
              <button
                key={pt.key}
                onClick={() => { setSelectedType(pt.key); setGenerated([]); }}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === pt.key ? "bg-green-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
            <input
              type="number"
              value={amount}
              min={1}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input
              type="number"
              value={quantity}
              min={1}
              max={50}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Shuffle size={18} />
          GENERAR
        </button>

        {generated.length > 0 && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="text-sm font-medium mb-2">Numeros generados:</h4>
            <div className="flex flex-wrap gap-2">
              {generated.map((num, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-white border rounded-lg font-mono font-bold text-lg text-green-700"
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}
