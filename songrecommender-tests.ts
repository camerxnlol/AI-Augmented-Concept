/**
 * SongRecommender Test Cases
 * 
 * Demonstrates both manual scheduling and LLM-assisted scheduling
 */

import { SongRecommender } from './songrecommender';
import { GeminiLLM, Config } from './gemini-llm';
import { assert } from 'console';

/**
 * Load configuration from config.json
 */
function loadConfig(): Config {
    try {
        const config = require('../config.json');
        return config;
    } catch (error) {
        console.error('❌ Error loading config.json. Please ensure it exists with your API key.');
        console.error('Error details:', (error as Error).message);
        process.exit(1);
    }
}

/**
 * Test case 1: Manual scheduling
 * Demonstrates adding and recommending songs manually
 */
export async function testManualRecommendation(): Promise<void> {
    console.log('\n🧪 TEST CASE 1: Manual Recommendation');
    console.log('==================================');

    const songRecommender = new SongRecommender();

    // Add some songs
    console.log('Adding songs...');
    songRecommender.addSong('Song 1', 'Artist 1', 'Genre 1');
    songRecommender.addSong('Song 2', 'Artist 2', 'Genre 2');
    songRecommender.addSong('Song 3', 'Artist 3', 'Genre 3');
    songRecommender.addSong('Song 4', 'Artist 4', 'Genre 4');
    songRecommender.addSong('Song 5', 'Artist 5', 'Genre 5');
    console.log('Songs added:', songRecommender.getNotYetRecommended());

    // Generate recommendations
    songRecommender.generateRecommendation(3);
    console.log('Generated recommendations:', songRecommender.getRecommended());

    // Check recommended songs list
    console.log('Recommended songs:', songRecommender.getRecommended());
    assert(songRecommender.getRecommended().length === 3);

    // Check not yet recommended songs list
    console.log('Not yet recommended songs:', songRecommender.getNotYetRecommended());
    assert(songRecommender.getNotYetRecommended().length === 2);
}

/**
 * Test case 2: LLM-assisted recommendation
 * Demonstrates adding songs and letting the LLM recommend them automatically
 */
export async function testLLMRecommendation(): Promise<void> {
    console.log('\n🧪 TEST CASE 2: LLM-Assisted Recommendation');
    console.log('========================================');

    const songRecommender = new SongRecommender();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    await songRecommender.generateRecommendationFromLLM(llm, 1);
    console.log('Generated recommendations:', songRecommender.getRecommended());
    assert(songRecommender.getRecommended().length === 1);
    console.log('Not yet recommended songs:', songRecommender.getNotYetRecommended());
    assert(songRecommender.getNotYetRecommended().length === 0);
}

/**
 * Test case 3: Removing songs
 * Demonstrates removing some songs manually
 */
export async function testRemoveSong(): Promise<void> {
    console.log('\n🧪 TEST CASE 3: Remove Song');
    console.log('=================================');

    const songRecommender = new SongRecommender();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    // Add activities
    console.log('Adding songs...');
    songRecommender.addSong('Song 1', 'Artist 1', 'Genre 1');
    songRecommender.addSong('Song 2', 'Artist 2', 'Genre 2');
    songRecommender.addSong('Song 3', 'Artist 3', 'Genre 3');
    songRecommender.addSong('Song 4', 'Artist 4', 'Genre 4');
    songRecommender.addSong('Song 5', 'Artist 5', 'Genre 5');
    console.log('Songs added:', songRecommender.getNotYetRecommended());
    assert(songRecommender.getNotYetRecommended().length === 5);

    // Remove a song
    console.log('Removing song 3...');
    songRecommender.removeSong({ title: 'Song 3', artist: 'Artist 3', genre: 'Genre 3' });
    console.log('Songs after removal:', songRecommender.getNotYetRecommended());
    assert(songRecommender.getNotYetRecommended().length === 4);

}

/**
 * Test case 4: LLM recommendation with more than one song
 * Demonstrates adding songs and letting the LLM recommend them automatically with more than one song
 */
export async function testLLMRecommendationWithMoreThanOneSong(): Promise<void> {
    console.log('\n🧪 TEST CASE 4: LLM Recommendation with More Than One Song');
    console.log('==================================================');

    const songRecommender = new SongRecommender();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    // Generate recommendations (5) without basis songs
    await songRecommender.generateRecommendationFromLLM(llm, 5);
    console.log('Generated recommendations:', songRecommender.getRecommended());
    assert(songRecommender.getRecommended().length === 5);
    console.log('Not yet recommended songs:', songRecommender.getNotYetRecommended());
    assert(songRecommender.getNotYetRecommended().length === 0);
}

/**
 * Test case 5: LLM recommendation with basis songs
 * Demonstrates adding songs and letting the LLM recommend them automatically with a list of basis songs
 */
export async function testLLMRecommendationWithBasisSongs(): Promise<void> {
    console.log('\n🧪 TEST CASE 5: LLM Recommendation with Basis Songs');
    console.log('==================================================');
    
    const songRecommender = new SongRecommender();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    // Add songs
    songRecommender.addSong('Blank Space', 'Taylor Swift', 'Pop');
    songRecommender.addSong('I Knew You Were Trouble', 'Taylor Swift', 'Pop');
    songRecommender.addSong('Love Story', 'Taylor Swift', 'Pop');
    songRecommender.addSong('You Belong with Me', 'Taylor Swift', 'Pop');
    songRecommender.addSong('Teardrops on My Guitar', 'Taylor Swift', 'Pop');

    // Generate recommendations manually
    songRecommender.generateRecommendation(5);
    console.log('recommended songs after generating recommendations manually:', songRecommender.getNotYetRecommended());
    assert(songRecommender.getRecommended().length === 5);
    assert(songRecommender.getNotYetRecommended().length === 0);

    // Generate recommendations with LLM with basis songs
    const generated = await songRecommender.generateRecommendationFromLLM(llm, 1, songRecommender.getRecommended());
    console.log('generated songs:', generated);
    assert(songRecommender.getRecommended().length === 6);
    console.log('Not yet recommended songs:', songRecommender.getNotYetRecommended());
    assert(songRecommender.getNotYetRecommended().length === 0);
}

/**
 * Test case 6: LLM recommendation with basis songs and more than one song
 * Demonstrates adding songs and letting the LLM recommend them automatically with a list of basis songs and more than one song
 */
export async function testLLMRecommendationWithBasisSongsAndMoreThanOneSong(): Promise<void> {
    console.log('\n🧪 TEST CASE 6: LLM Recommendation with Basis Songs and More Than One Song');
    console.log('==================================================');

    const songRecommender = new SongRecommender();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    // Add songs
    songRecommender.addSong('Blank Space', 'Taylor Swift', 'Pop');
    songRecommender.addSong('I Knew You Were Trouble', 'Taylor Swift', 'Pop');
    songRecommender.addSong('Love Story', 'Taylor Swift', 'Pop');
    songRecommender.addSong('You Belong with Me', 'Taylor Swift', 'Pop');
    songRecommender.addSong('Teardrops on My Guitar', 'Taylor Swift', 'Pop');

    // Generate recommendations with LLM with basis songs and more than one song
    songRecommender.generateRecommendation(5);
    const generated = await songRecommender.generateRecommendationFromLLM(llm, 5, songRecommender.getRecommended());
    console.log('generated songs:', generated);
    assert(songRecommender.getRecommended().length === 10);
    console.log('Not yet recommended songs:', songRecommender.getNotYetRecommended());
    assert(songRecommender.getNotYetRecommended().length === 0);
}

/**
 * Main function to run all test cases
 */
async function main(): Promise<void> {
    console.log('SongRecommender Test Suite');
    console.log('========================\n');

    try {
        // Run manual scheduling test
        await testManualRecommendation();

        // Run LLM recommendation test
        await testLLMRecommendation();

        // Run remove song test
        await testRemoveSong();

        // Run LLM recommendation with more than one song test
        await testLLMRecommendationWithMoreThanOneSong();

        // Run LLM recommendation with basis songs test
        await testLLMRecommendationWithBasisSongs();

        // Run LLM recommendation with basis songs and more than one song test
        await testLLMRecommendationWithBasisSongsAndMoreThanOneSong();

        console.log('\n🎉 All test cases completed successfully!');

    } catch (error) {
        console.error('❌ Test error:', (error as Error).message);
        process.exit(1);
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    main();
}
