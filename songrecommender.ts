/**
 * SongRecommender Concept - AI Augmented Version
 */

import { GeminiLLM } from './gemini-llm';

export interface Song {
    title: string;
    artist: string;
    genre: string;
}

export class SongRecommender {
    private notYetRecommended: Song[] = [];
    private recommended: Song[] = [];

    addSong(title: string, artist: string, genre: string): void {
        if (!title || !artist || !genre) {
            throw new Error('Title, artist, and genre are required');
        }
        const existing = this.notYetRecommended.find(s => this.isSameSong(s, { title, artist, genre }));
        // add song to notYetRecommended if it is not already in the list
        if (!existing) {
            const song: Song = { title, artist, genre };
            this.notYetRecommended.push(song);
        }
    }

    removeSong(song: Song): void {
        if (!this.notYetRecommended.some(s => this.isSameSong(s, song))) {
            throw new Error('Song must be in NotYetRecommendedSongs');
        }
        this.notYetRecommended = this.notYetRecommended.filter(s => !this.isSameSong(s, song));
    }


    generateRecommendation(count: number): Song[] {
        if (!Number.isInteger(count) || count < 1) {
            throw new Error('count must be an integer >= 1');
        }
        if (this.notYetRecommended.length < count) {
            throw new Error('Not enough songs available to recommend');
        }
        const selected = this.notYetRecommended.slice(0, count);

        for (const song of selected) {
            this.notYetRecommended = this.notYetRecommended.filter(s => !this.isSameSong(s, song));
            if (!this.recommended.some(s => this.isSameSong(s, song))) {
                this.recommended.push(song);
            }
        }

        return selected;
    }

    async generateRecommendationFromLLM(llm: GeminiLLM, count: number, basisSongs?: Song[]): Promise<Song[]> {
        if (!Number.isInteger(count) || count < 1) {
            throw new Error('count must be an integer >= 1');
        }

        console.log('🤖 Requesting song recommendations from Gemini AI...');

        const prompt = this.createLLMPrompt(count, basisSongs);
        const text = await llm.executeLLM(prompt);

        console.log('✅ Received response from Gemini AI!');
        console.log('\n🤖 RAW GEMINI RESPONSE');
        console.log('======================');
        console.log(text);
        console.log('======================\n');

        const songs = this.parseLLMRecommendations(text);
        if (!Array.isArray(songs) || songs.length !== count) {
            throw new Error(`LLM did not return exactly ${count} songs. Got ${Array.isArray(songs) ? songs.length : 'invalid response'}`);
        }
        const verifyPrompt = this.verifySongsExistPrompt(songs);
        const verifyText = await llm.executeLLM(verifyPrompt);
        const verifyResponse = this.parseVerifySongsExistResponse(verifyText);
        if (!verifyResponse) {
            throw new Error('Some songs do not exist. Please try again.');
        }

        for (const s of songs) {
            const song: Song = { title: s.title, artist: s.artist, genre: s.genre };
            if (!this.recommended.some(existing => this.isSameSong(existing, song))) {
                this.recommended.push(song);
            }
            this.notYetRecommended = this.notYetRecommended.filter(existing => !this.isSameSong(existing, song));
        }
        return songs;
    }

    getRecommended(): Song[] {
        return this.recommended.slice();
    }

    getNotYetRecommended(): Song[] {
        return this.notYetRecommended.slice();
    }

    // ---------- Helpers ----------

    private isSameSong(a: Song, b: Song): boolean {
        return a.title.toLowerCase() === b.title.toLowerCase()
            && a.artist.toLowerCase() === b.artist.toLowerCase()
            && a.genre.toLowerCase() === b.genre.toLowerCase();
    }

    private createLLMPrompt(count: number, basisSongs?: Song[]): string {
        const basisSection = basisSongs && basisSongs.length > 0
            ? `\nCHOOSE SONGS THAT ARE VERY DIFFERENT IN STYLE, GENRE, OR ARTIST FROM THE FOLLOWING THE GOAL IS TO RECOMMEND SONGS THAT ARE VERY DIFFERENT FROM THE BASIS SONGS DO NOT WORRY IF THE USER MIGHT NOT LIKE THE SONGS, WE ARE TRYING TO GROW THEIR MUSIC TASTE:\n${basisSongs.map(s => `- ${s.title} by ${s.artist} (${s.genre})`).join('\n')}\n`
            : '\nChoose currently trending songs across popular genres.\n';

        return `You are a helpful music recommendation assistant.
                Recommend EXACTLY ${count} new songs.

                CRITICAL REQUIREMENTS:
                1. Return ONLY valid JSON. No leading/trailing text.
                2. The JSON MUST match this exact schema:
                {
                "songs": [
                    { "song": String, "artist": String, "genre": String }
                ]
                }
                3. Provide exactly ${count} distinct songs.
                4. DO NOT RECOMMEND SONGS THAT ARE ALREADY IN THE CATALOG.
                5. DO NOT RECOMMEND THE SAME SONG TWICE.
                6. ${basisSection}

                ALREADY IN CATALOG (avoid duplicates by title+artist):
                ${this.notYetRecommended.map(s => `- ${s.title} by ${s.artist} (${s.genre})`).join('\n') || '- (none)'}
                Return ONLY the JSON object, no additional text.`;
    }

    private verifySongsExistPrompt(recommendations: Song[]): string {
        const prompt = `You are a helpful music recommendation assistant.
                Verify that all of the following songs exist:
                ${recommendations.map(s => `- ${s.title} by ${s.artist} (${s.genre})`).join('\n')}
                If all the songs exist, return the number 1 and nothing else. If any of the songs do not exist, return the number 0 and nothing else.`;
        return prompt;
    }

    private parseVerifySongsExistResponse(responseText: string): boolean {
        if (responseText === '1') {
            return true;
        } else if (responseText === '0') {
            return false;
        } else {
            throw new Error('Invalid response: ' + responseText);
        }
    }

    private parseLLMRecommendations(responseText: string): Song[] {
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            const response = JSON.parse(jsonMatch[0]);
            if (!response.songs || !Array.isArray(response.songs)) {
                throw new Error('Invalid response format: missing songs array');
            }
            const parsed: Song[] = [];
            const issues: string[] = [];
            for (const entry of response.songs) {
                if (typeof entry !== 'object' || entry === null) {
                    issues.push('Song entry is not an object');
                    continue;
                }
                const songTitle = (entry as { song?: unknown }).song;
                const artist = (entry as { artist?: unknown }).artist;
                const genre = (entry as { genre?: unknown }).genre;
                if (typeof songTitle !== 'string' || songTitle.trim().length === 0) {
                    issues.push('Missing or invalid song title');
                    continue;
                }
                if (typeof artist !== 'string' || artist.trim().length === 0) {
                    issues.push(`Missing or invalid artist for "${songTitle}"`);
                    continue;
                }
                if (typeof genre !== 'string' || genre.trim().length === 0) {
                    issues.push(`Missing or invalid genre for "${songTitle}"`);
                    continue;
                }
                const candidate: Song = { title: songTitle, artist, genre };
                // Skip duplicates already in catalog
                if (this.notYetRecommended.some(s => this.isSameSong(s, candidate))) {
                    continue;
                }
                parsed.push(candidate);
            }
            if (issues.length > 0) {
                console.warn('⚠️ Some LLM entries were skipped due to validation issues:\n- ' + issues.join('\n- '));
            }
            return parsed;
        } catch (error) {
            console.error('❌ Error parsing LLM response:', (error as Error).message);
            console.log('Response was:', responseText);
            throw error;
        }
    }
}