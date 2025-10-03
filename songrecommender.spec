<concept_spec>
concept SongRecommender

purpose
    To introduce a new song for the user each day

principle
    Each day, the system presents a new song to the user, chosen from a list of songs. 
    The user can listen to the song.
    Recommendations refresh daily and past recommendations can be revisited.

state
    a set of RecommendedSongs with
        a name String
        an artist String
        a genre String
    a set of NotYetRecommendedSongs of type Song
        a name String
        an artist String
        a genre String

    invariants
        The intersection of RecommendedSongs and NotYetRecommendedSongs is empty.

actions
    addSong(song: Song)
        requires song is not an element of RecommendedSongs or NotYetRecommendedSongs
        effect adds song to the set of NotYetRecommendedSongs

    generateRecommendation(count: Number)
        requires count is less than or equal to the number of songs in NotYetRecommendedSongs
        effect moves songs from NotYetRecommendedSongs to RecommendedSongs

    removeSong(song: Song)`
        requires song to be in NotYetRecommendedSongs
        effect removes song from NotYetRecommendedSongs

    async generateRecommendationFromLLM(llm: GeminiLLM, count: Number, basisSongs: Song[]?)
        effect Uses an LLM to generate count new songs and adds them to NotYetRecommendedSongs. If basisSongs is provided, the new songs are based on the provided songs. If basisSongs is not provided, the new songs are based on current "trending" music.

</concept_spec>