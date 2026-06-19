import { PlayerRole } from "@prisma/client";

import { prisma } from "../lib/prisma.ts";
import { importPlayerList } from "../lib/server/players/import-player-list.ts";

const demoPlayers = [
  { externalId: "demo-001", name: "Alessio Ventura", role: PlayerRole.GOALKEEPER, teamName: "Virtus Milano" },
  { externalId: "demo-002", name: "Marco Rinaldi", role: PlayerRole.DEFENDER, teamName: "Borgo United" },
  { externalId: "demo-003", name: "Simone Greco", role: PlayerRole.DEFENDER, teamName: "Tevere Calcio" },
  { externalId: "demo-004", name: "Davide Ferri", role: PlayerRole.MIDFIELDER, teamName: "Aurora Torino" },
  { externalId: "demo-005", name: "Nicolo Serra", role: PlayerRole.MIDFIELDER, teamName: "Maremma FC" },
  { externalId: "demo-006", name: "Tommaso Galli", role: PlayerRole.MIDFIELDER, teamName: "Stella Azzurra" },
  { externalId: "demo-007", name: "Lorenzo Piras", role: PlayerRole.ATTACKER, teamName: "Citta del Faro" },
  { externalId: "demo-008", name: "Gabriele Sala", role: PlayerRole.ATTACKER, teamName: "Polisportiva Etna" },
  { externalId: "demo-009", name: "Federico Conti", role: PlayerRole.GOALKEEPER, teamName: "Virtus Milano" },
  { externalId: "demo-010", name: "Matteo Villa", role: PlayerRole.DEFENDER, teamName: "Borgo United" },
  { externalId: "demo-011", name: "Andrea Guidi", role: PlayerRole.DEFENDER, teamName: "Tevere Calcio" },
  { externalId: "demo-012", name: "Riccardo Testa", role: PlayerRole.MIDFIELDER, teamName: "Aurora Torino" },
  { externalId: "demo-013", name: "Edoardo Fabbri", role: PlayerRole.MIDFIELDER, teamName: "Maremma FC" },
  { externalId: "demo-014", name: "Pietro Longo", role: PlayerRole.MIDFIELDER, teamName: "Stella Azzurra" },
  { externalId: "demo-015", name: "Samuele Caruso", role: PlayerRole.ATTACKER, teamName: "Citta del Faro" },
  { externalId: "demo-016", name: "Filippo Donati", role: PlayerRole.ATTACKER, teamName: "Polisportiva Etna" },
  { externalId: "demo-017", name: "Christian Moretti", role: PlayerRole.GOALKEEPER, teamName: "Virtus Milano" },
  { externalId: "demo-018", name: "Leonardo D'Amico", role: PlayerRole.DEFENDER, teamName: "Borgo United" },
  { externalId: "demo-019", name: "Mattia De Luca", role: PlayerRole.DEFENDER, teamName: "Tevere Calcio" },
  { externalId: "demo-020", name: "Jacopo Ferrara", role: PlayerRole.MIDFIELDER, teamName: "Aurora Torino" },
  { externalId: "demo-021", name: "Daniele Bellini", role: PlayerRole.MIDFIELDER, teamName: "Maremma FC" },
  { externalId: "demo-022", name: "Elia Fontana", role: PlayerRole.MIDFIELDER, teamName: "Stella Azzurra" },
  { externalId: "demo-023", name: "Francesco Vitali", role: PlayerRole.ATTACKER, teamName: "Citta del Faro" },
  { externalId: "demo-024", name: "Michele Rossetti", role: PlayerRole.ATTACKER, teamName: "Polisportiva Etna" },
  { externalId: "demo-025", name: "Giorgio Marini", role: PlayerRole.GOALKEEPER, teamName: "Virtus Milano" },
  { externalId: "demo-026", name: "Fabio Esposito", role: PlayerRole.DEFENDER, teamName: "Borgo United" },
  { externalId: "demo-027", name: "Stefano Parisi", role: PlayerRole.DEFENDER, teamName: "Tevere Calcio" },
  { externalId: "demo-028", name: "Alberto Colombo", role: PlayerRole.MIDFIELDER, teamName: "Aurora Torino" },
  { externalId: "demo-029", name: "Valerio Messina", role: PlayerRole.MIDFIELDER, teamName: "Maremma FC" },
  { externalId: "demo-030", name: "Antonio Riva", role: PlayerRole.MIDFIELDER, teamName: "Stella Azzurra" },
  { externalId: "demo-031", name: "Roberto Fiore", role: PlayerRole.ATTACKER, teamName: "Citta del Faro" },
  { externalId: "demo-032", name: "Diego Monti", role: PlayerRole.ATTACKER, teamName: "Polisportiva Etna" }
] as const;

async function main() {
  const result = await importPlayerList(
    demoPlayers.map((player) => ({
      ...player,
      isActive: true,
      source: "demo"
    }))
  );

  console.log(
    `Import demo players completato. Totale: ${result.total}, creati: ${result.createdCount}, aggiornati: ${result.updatedCount}.`
  );
}

main().catch((error) => {
  console.error("Errore durante l'import demo players:", error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
