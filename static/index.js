const fetchJSON = async (url) => {
    try {
        const res = await fetch(url)
         
        if (!res.ok) throw new Error('Fetch failed!')

        return await res.json()

    } catch(error) {
        console.error("Error fetching main_characters.json", error)
        return null

    }
}

const loadData = async () => {
    const main_characters_arr = await fetchJSON("static/main_characters.json")
    const interactions_arr = await fetchJSON("static/interactions.json")
    console.log(main_characters_arr, interactions_arr)

    const num_interactions_per_char = interactions_arr.map(arr => arr.reduce((sum, el) => el ? sum + el[1] : sum, 0))
    console.log(num_interactions_per_char)
}

loadData()
