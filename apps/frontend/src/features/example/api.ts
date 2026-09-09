import { apiFetch } from "@/common/api";

export interface Match {
	id: string;
	homeTeam: string;
	awayTeam: string;
	homeScore: number;
	awayScore: number;
	playedOn: string;
}

export interface CreateMatchInput {
	homeTeam: string;
	awayTeam: string;
}

export const fetchMatches = (): Promise<Array<Match>> =>
	apiFetch<Array<Match>>("/api/v1/matches");

export const createMatch = (input: CreateMatchInput): Promise<Match> =>
	apiFetch<Match>("/api/v1/matches", {
		method: "POST",
		body: JSON.stringify(input),
	});
